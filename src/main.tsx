import { Dialogue } from "./art/Dialogue";
import { GraphicsSettings } from "./art/GraphicsSettings";
import "./art/ambience.css";
import { readAudio, setAudio, playSound, stopAmbience } from "./art/audio";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Phaser from "phaser";
import { Village, controls, type View } from "./game/Game";
import { initial, type Save } from "./domain";
import { loadSave, writeSave } from "./save";
import "./style.css";
import "./art/style.css";
import "./art/correction-d1.css";
import { activeGoals, quests } from "./rpg/quests";
import { MiniGame } from "./ui/MiniGame";
import { AdventHub } from "./advent/Hub";
function App() {
  const host = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>();
  const [started, setStarted] = useState(false);
  const [journal, setJournal] = useState(false);
  const [settings, setSettings] = useState(false);
  const [audioPreferences, setAudioPreferences] = useState(readAudio);
  const [adventOpen, setAdventOpen] = useState(0),
    [adventBusy, setAdventBusy] = useState(false);
  const [tab, setTab] = useState("calendar");
  const [day, setDay] = useState(1);
  const [status, setStatus] = useState("Chargement de la sauvegarde…");
  const scene = useRef<Village | undefined>(undefined);
  const stick = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const keyboardBlocked =
    journal || settings || !!view?.miniGame || (adventBusy && !view?.cinematic);
  useEffect(() => {
    const keyboard = scene.current?.input.keyboard;
    if (!keyboard) return;
    keyboard.resetKeys();
    keyboard.enabled = !keyboardBlocked;
    if (keyboardBlocked) keyboard.disableGlobalCapture();
    else keyboard.enableGlobalCapture();
  }, [keyboardBlocked, !!view]);
  useEffect(() => {
    setAudio(audioPreferences);
  }, [audioPreferences]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if ((event.target as Element)?.closest("button")) playSound("click");
    };
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("click", click);
      stopAmbience();
    };
  }, []);
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
        <a className="brand" href="#" aria-label="Étoilebois">
          Étoilebois
        </a>
        <div className="hud-status">
          <time
            className="hud-date"
            dateTime={new Date().toISOString()}
            aria-label="Date à Paris"
          >
            {new Intl.DateTimeFormat("fr-FR", {
              timeZone: "Europe/Paris",
              day: "numeric",
              month: "short",
            }).format(new Date())}
          </time>
          <span className="hud-stars" aria-label="Étoiles récupérées">
            {Math.max(stars.length, view?.adventStars ?? 0)} / 24
          </span>
        </div>
        <div className="header-actions">
          <button
            aria-label="✦ Avent 2026"
            disabled={
              !started ||
              settings ||
              journal ||
              adventBusy ||
              !!view?.dialogue ||
              !!view?.miniGame
            }
            onClick={() => setAdventOpen((n) => n + 1)}
          >
            <span className="hud-icon calendar-icon" aria-hidden="true" />{" "}
            <span>Avent 2026</span>
          </button>
          <button
            aria-label="✧ Journal"
            onClick={toggleJournal}
            disabled={
              !started ||
              settings ||
              adventBusy ||
              !!view?.miniGame ||
              !!view?.dialogue
            }
          >
            <span className="hud-icon journal-icon" aria-hidden="true" />{" "}
            <span>Journal</span>
          </button>
          <button
            disabled={
              !started ||
              settings ||
              journal ||
              adventBusy ||
              !!view?.dialogue ||
              !!view?.miniGame
            }
            onClick={() => {
              setSettings(true);
              controls.paused = true;
            }}
            aria-label="Paramètres"
          >
            <span className="hud-icon settings-icon" aria-hidden="true" />
            <span>Paramètres</span>
          </button>
        </div>
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
            Étoilebois · Calendrier interactif 2026
            <br />
            Une promenade sous la neige, vingt-quatre étoiles à découvrir.
          </p>
          <img
            src="/assets/validated/calendar/calendrier_art.png"
            alt="Illustration validée du calendrier d’Étoilebois"
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
                  "Rencontrez Célestine à la bibliothèque, Basile à l’atelier, Madeleine à l’auberge et Augustin sur la place."}
              </p>
              {goals.length > 1 && (
                <small>
                  {goals.length - 1} autre(s) quête(s) dans le journal
                </small>
              )}
            </aside>
            <div className="prototype"></div>
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
              <Dialogue
                line={view.dialogue}
                choices={view.choices}
                choose={(i) => scene.current?.selectChoice(i)}
                advance={() => {
                  controls.interact = true;
                }}
              />
            ) : (
              <button
                className="interaction"
                disabled={!view?.target || view?.transitioning}
                onClick={() => {
                  controls.interact = true;
                }}
              >
                <kbd>E</kbd>{" "}
                {view?.transitioning
                  ? "Un instant…"
                  : view?.target || "Approchez-vous pour interagir"}
              </button>
            )}
            {settings && (
              <div
                className="settings-panel"
                role="dialog"
                aria-label="Paramètres"
              >
                <button
                  className="close"
                  onClick={() => {
                    setSettings(false);
                    controls.paused = false;
                  }}
                >
                  Fermer ×
                </button>
                <h2>Un hiver à votre rythme</h2>
                <GraphicsSettings />
                <p>
                  Les animations respectent la préférence de réduction des
                  mouvements de votre appareil.
                </p>
                <p>
                  Flèches, ZQSD ou WASD pour marcher. E pour interagir. Sur
                  téléphone, utilisez le joystick.
                </p>
                <p>
                  Votre progression est enregistrée automatiquement. Les
                  paramètres n'effacent aucun souvenir.
                </p>
                <p>
                  Ambiance sonore : emplacements préparés, aucun son autorisé
                  fourni.
                </p>
                <label>
                  <input
                    type="checkbox"
                    checked={audioPreferences.muted}
                    onChange={(e) =>
                      setAudioPreferences((p) => ({
                        ...p,
                        muted: e.target.checked,
                      }))
                    }
                  />{" "}
                  Muet
                </label>
                <label>
                  Volume{" "}
                  <input
                    aria-label="Volume"
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    value={audioPreferences.volume}
                    onChange={(e) =>
                      setAudioPreferences((p) => ({
                        ...p,
                        volume: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              </div>
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
                  Archives fictives du village · Phase B. Le calendrier 2026 est
                  accessible avec le bouton « Avent 2026 ».
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
            {view && scene.current && (
              <AdventHub
                scene={scene.current}
                view={view}
                openRequest={adventOpen}
                onBusy={setAdventBusy}
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
