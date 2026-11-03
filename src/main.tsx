import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Phaser from "phaser";
import { Village, controls, type View } from "./game/Game";
import { initial, objectives, type Save } from "./domain";
import { loadSave, writeSave } from "./save";
import "./style.css";
import { activeGoals, quests } from "./rpg/quests";
import { MiniGame } from "./ui/MiniGame";
function App() {
  const host = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>();
  const [started, setStarted] = useState(false);
  const [journal, setJournal] = useState(false);
  const [tab, setTab] = useState("calendar");
  const [day, setDay] = useState(1);
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
  const goals = view ? activeGoals(view.save) : [];
  const stars = view?.save.stars ?? [];
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
        <button
          onClick={toggleJournal}
          disabled={!started || !!view?.miniGame || !!view?.dialogue}
        >
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
            Phase B · Village et activités jouables
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
              <small>{view?.period ?? "Nuit d’hiver"} · Démo libre</small>
            </div>
            <aside className="quest">
              <span>✦ {stars.length} / 24 ÉTOILES</span>
              <strong>{goals[0]?.title ?? "Le village vous attend"}</strong>
              <p>
                {goals[0]?.label ??
                  "Rencontrez Mira à la bibliothèque, Oscar à l’atelier, Alma à l’auberge et Noé sur la place."}
              </p>
              {goals.length > 1 && (
                <small>
                  {goals.length - 1} autre(s) quête(s) dans le journal
                </small>
              )}
            </aside>
            <div className="prototype">PHASE B · ASSETS PROVISOIRES</div>
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
                {view.choices.length ? (
                  <div className="dialogue-choices">
                    {view.choices.map((choice, i) => (
                      <button
                        key={choice}
                        onClick={() => scene.current?.selectChoice(i)}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      controls.interact = true;
                    }}
                  >
                    Continuer <kbd>E</kbd>
                  </button>
                )}
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
                  Souvenirs fictifs de démonstration · calendrier réel non
                  connecté.
                </p>
                <nav className="journal-tabs" aria-label="Rubriques du journal">
                  {[
                    ["calendar", "Calendrier"],
                    ["quests", "Quêtes"],
                    ["inventory", "Sac"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      aria-pressed={tab === id}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
                {tab === "calendar" ? (
                  <>
                    <div className="days">
                      {Array.from({ length: 24 }, (_, i) => (
                        <div
                          key={i}
                          className={stars.includes(i + 1) ? "earned" : ""}
                        >
                          <button
                            aria-label={`Jour ${i + 1}`}
                            aria-pressed={day === i + 1}
                            onClick={() => setDay(i + 1)}
                          >
                            {i + 1}
                            <small>{stars.includes(i + 1) ? "✦" : "·"}</small>
                          </button>
                        </div>
                      ))}
                    </div>
                    <p aria-live="polite">
                      Jour {day} ·{" "}
                      {stars.includes(day)
                        ? `Souvenir de démonstration gagné : ${quests.find((q) => q.day === day)?.title}`
                        : day <= 5
                          ? "Un souvenir fictif se gagne auprès des habitants. Consultez vos quêtes."
                          : "Emplacement réservé. Aucune surprise future n’est livrée dans cette démo."}
                    </p>
                  </>
                ) : tab === "quests" ? (
                  <div className="quest-list">
                    {quests.map((q) => {
                      const progress = view?.save.quests[q.id];
                      return (
                        <article key={q.id}>
                          <h3>
                            {q.title} {progress?.done ? "✦" : ""}
                          </h3>
                          <p>
                            {!progress
                              ? "À découvrir auprès des habitants"
                              : progress.done
                                ? "Souvenir gagné"
                                : q.objectives[progress.step]?.label}
                          </p>
                          <small>
                            {progress?.step ?? 0} / {q.objectives.length}{" "}
                            objectifs
                          </small>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <section>
                    <h3>Votre sac</h3>
                    <ul>
                      {(view?.save.inventory ?? []).map((item) => (
                        <li key={item}>
                          {{
                            bookmark: "Marque-page brodé",
                            ribbon: "Ruban de l’atelier",
                            letter: "Lettre de Loyal",
                          }[item] ?? item}
                        </li>
                      ))}
                    </ul>
                    {!view?.save.inventory.length && (
                      <p>Votre sac est encore vide.</p>
                    )}
                    <h3>Meilleurs résultats</h3>
                    {Object.entries(view?.save.scores ?? {}).map(
                      ([game, score]) => (
                        <p key={game}>
                          {{
                            photo: "Photographie",
                            memory: "Mémoire",
                            wrap: "Emballage",
                          }[game] ?? game}{" "}
                          : {score} essais
                        </p>
                      ),
                    )}
                  </section>
                )}
              </div>
            )}
            {view?.miniGame && (
              <MiniGame
                key={view.miniGame}
                kind={view.miniGame}
                onClose={() => scene.current?.closeMini()}
                onWin={(score) => scene.current?.finishMini(score)}
              />
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
