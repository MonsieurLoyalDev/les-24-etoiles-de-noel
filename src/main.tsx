import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Phaser from "phaser";
import { Village, controls, type View } from "./game/Game";
import { initial, objectives, type Save } from "./domain";
import { loadSave, writeSave } from "./save";
import "./style.css";
function App() {
  const host = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>();
  const [started, setStarted] = useState(false);
  const [journal, setJournal] = useState(false);
  const [status, setStatus] = useState("Chargement de la sauvegarde…");
  const scene = useRef<Village | undefined>(undefined);
  const stick = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!started) return;
    let game: Phaser.Game | undefined,
      active = true;
    let chain = Promise.resolve();
    const persist = (s: Save) => {
      const snapshot = structuredClone(s);
      chain = chain
        .then(() => writeSave(snapshot))
        .then(() => {
          if (active) setStatus("Progression enregistrée sur cet appareil");
        })
        .catch(() => {
          if (active)
            setStatus("Sauvegarde indisponible · progression en mémoire");
        });
    };
    loadSave()
      .catch(() => {
        setStatus("Sauvegarde indisponible · progression en mémoire");
        return null;
      })
      .then((saved) => {
        if (!active) return;
        const world = new Village(saved ?? initial, setView, persist);
        scene.current = world;
        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: host.current!,
          backgroundColor: "#131c32",
          pixelArt: true,
          roundPixels: true,
          scale: {
            mode: Phaser.Scale.RESIZE,
            width: host.current!.clientWidth,
            height: host.current!.clientHeight,
          },
          scene: [world],
          audio: { noAudio: true },
        });
        setStatus(saved ? "Partie retrouvée" : "Nouvelle aventure");
      });
    const interval = setInterval(() => {
      if (scene.current?.player) persist(scene.current.state);
    }, 4000);
    const blur = () => {
      controls.x = 0;
      controls.y = 0;
      scene.current?.input.keyboard?.resetKeys();
      if (scene.current?.player) persist(scene.current.state);
    };
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", blur);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", blur);
      game?.destroy(true);
    };
  }, [started]);
  const toggleJournal = () =>
    setJournal((v) => {
      controls.paused = !v;
      controls.x = 0;
      controls.y = 0;
      return !v;
    });
  const resetStick = () => {
    controls.x = 0;
    controls.y = 0;
    setKnob({ x: 0, y: 0 });
  };
  return (
    <main>
      <header>
        <a className="brand" href="#">
          ✦{" "}
          <span>
            LES 24 ÉTOILES <small>DE NOËL</small>
          </span>
        </a>
        <span className="dedication">Une aventure pour Debby</span>
        <button onClick={toggleJournal} disabled={!started}>
          ✧ Journal <span>24</span>
        </button>
      </header>
      {!started ? (
        <section className="welcome">
          <p className="eyebrow">BIENVENUE À ÉTOILEBOIS</p>
          <h1>
            Les nuits d’hiver.
            <br />
            Nos étoiles à nous.
          </h1>
          <p>
            Un village sous la neige, une lettre à retrouver
            <br />
            et le début d’une histoire avec Loyal.
          </p>
          <button className="gold" onClick={() => setStarted(true)}>
            Entrer dans le village <span>→</span>
          </button>
          <p className="note">
            Phase A · Démonstration jouable
            <br />
            Personnages et façades provisoires · deux personnages humains
          </p>
          <img
            src="/assets/references/place_lanternes_concept.png"
            alt="Planche artistique du village, référence uniquement"
          />
        </section>
      ) : (
        <>
          <section className="game-shell">
            <div ref={host} className="game" aria-label="Village explorable" />
            <div className="location">
              <span>ÉTOILEBOIS</span>
              <strong>{view?.location ?? "Préparation du village…"}</strong>
              <small>Nuit d’hiver · Démo libre</small>
            </div>
            <aside className="quest">
              <span>✦ {view?.save.stage === 4 ? "1" : "0"} / 24 ÉTOILES</span>
              <strong>La première lumière</strong>
              <p>{objectives[view?.save.stage ?? 0]}</p>
            </aside>
            <div className="prototype">PHASE A · ASSETS PROVISOIRES</div>
            <div
              ref={stick}
              className="joystick"
              aria-label="Joystick de déplacement"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const r = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2,
                  y = e.clientY - r.top - r.height / 2,
                  d = Math.max(30, Math.hypot(x, y));
                controls.x = x / d;
                controls.y = y / d;
                setKnob({ x: (x / d) * 30, y: (y / d) * 30 });
              }}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                const r = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2,
                  y = e.clientY - r.top - r.height / 2,
                  d = Math.max(30, Math.hypot(x, y));
                controls.x = x / d;
                controls.y = y / d;
                setKnob({ x: (x / d) * 30, y: (y / d) * 30 });
              }}
              onPointerUp={resetStick}
              onPointerCancel={resetStick}
              onLostPointerCapture={resetStick}
            >
              <i style={{ transform: `translate(${knob.x}px,${knob.y}px)` }}>
                ✥
              </i>
            </div>
            {view?.dialogue ? (
              <div className="dialogue" role="dialog" aria-label="Dialogue">
                <span>✧ UN MOMENT ENSEMBLE</span>
                <p>{view.dialogue}</p>
                <button
                  onClick={() => {
                    controls.interact = true;
                  }}
                >
                  Continuer <kbd>E</kbd>
                </button>
              </div>
            ) : (
              <button
                className="interaction"
                disabled={!view?.target}
                onClick={() => {
                  controls.interact = true;
                }}
              >
                <kbd>E</kbd> {view?.target || "Approchez-vous pour interagir"}
              </button>
            )}
            {journal && (
              <div
                className="journal"
                role="dialog"
                aria-label="Journal des étoiles"
              >
                <button onClick={toggleJournal} className="close">
                  Fermer ×
                </button>
                <p className="eyebrow">VOTRE JOURNAL</p>
                <h2>24 jours, autant de souvenirs.</h2>
                <p>
                  Démo libre · le calendrier réel n’est pas encore connecté.
                </p>
                <div className="days">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      key={i}
                      className={
                        i === 0 && view?.save.stage === 4 ? "earned" : ""
                      }
                    >
                      {i + 1}
                      <small>
                        {i === 0 && view?.save.stage === 4 ? "✦" : "·"}
                      </small>
                    </div>
                  ))}
                </div>
                <p>{objectives[view?.save.stage ?? 0]}</p>
              </div>
            )}
          </section>
          <footer>
            <span>
              Flèches / ZQSD / WASD · <kbd>E</kbd> Interagir
            </span>
            <span role="status">{status}</span>
          </footer>
        </>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
