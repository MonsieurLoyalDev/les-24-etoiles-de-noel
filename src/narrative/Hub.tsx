import { useEffect, useRef, useState } from "react";
import "./polish.css";
import "./flow.css";
import { FlowTask } from "./FlowTask";
import { loadNarrativeMedia } from "./private-media";
import type { AdventAPI } from "../advent/api";
import { getLocal, putLocal } from "../advent/local";
import { controls, type Village, type View } from "../game/Game";
import { NarrativeDirector } from "./Director";
import { privateEpisodeAPI, type EpisodeAPI, type EpisodeStatus } from "./api";
import { startEpisode } from "./engine";
import {
  initialRuntime,
  validateRuntime,
  type EpisodeProgress,
} from "./script";
import { loadCheckpoint, saveCheckpoint } from "./checkpoint";
import { presentation } from "./orchestration";

export function NarrativeHub({
  api: legacy,
  scene,
  view,
  openRequest,
  dayRequest,
  onBusy,
  onStart,
}: {
  api: AdventAPI | undefined;
  scene: Village;
  view: View;
  openRequest: number;
  dayRequest: { day: number; replay: boolean; preview: boolean } | null;
  onBusy: (value: boolean) => void;
  onStart: () => void | Promise<void>;
}) {
  const [panel, setPanel] = useState(false),
    [preview, setPreview] = useState(false),
    [api, setApi] = useState<EpisodeAPI | null>(null),
    [statuses, setStatuses] = useState<EpisodeStatus[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const [pendingLaunch, setPendingLaunch] = useState<typeof dayRequest>(null);
  const director = useRef<NarrativeDirector | null>(null),
    launchInFlight = useRef<number | null>(null),
    generation = useRef(0),
    lastRequest = useRef(openRequest),
    startCallback = useRef(onStart);
  startCallback.current = onStart;
  const activeKey = api
    ? `narrative:active:${api.mode}:${api.userId}:${api.preview ? "preview" : "player"}`
    : "";
  useEffect(() => {
    onBusy(panel || loading || !!view.narrative?.task);
  }, [panel, loading, onBusy, !!view.narrative?.task]);
  useEffect(() => {
    let active = true;
    const gen = ++generation.current;
    director.current?.stop();
    director.current = null;
    setStatuses([]);
    setError("");
    setApi(null);
    if (legacy?.mode === "supabase")
      setApi(privateEpisodeAPI(legacy.userId, preview, legacy.isAdmin));
    else if (import.meta.env.DEV && legacy?.mode === "demo")
      void import("./author")
        .then((m) => m.authorAPI())
        .then((next) => {
          if (active && gen === generation.current) setApi(next);
        })
        .catch((e) => setError(message(e)));
    return () => {
      active = false;
      controls.run = false;
      director.current?.stop();
      director.current = null;
    };
  }, [legacy?.userId, legacy?.mode, preview]);
  useEffect(() => {
    if (!api) return;
    let active = true;
    void getLocal<number | { day: number; replay: boolean }>(activeKey)
      .then(async (intent) => {
        if (active && intent)
          await begin(
            typeof intent === "number" ? intent : intent.day,
            typeof intent === "number" ? false : intent.replay,
            true,
          );
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, [api]);
  useEffect(() => {
    if (lastRequest.current === openRequest) return;
    lastRequest.current = openRequest;
    setPanel(true);
    setError("");
    if (dayRequest) {
      setPreview(dayRequest.preview);
      setPendingLaunch(dayRequest);
    }
    if (api) void refresh();
  }, [openRequest]);
  useEffect(() => {
    if (api && pendingLaunch && api.preview === pendingLaunch.preview) {
      setPendingLaunch(null);
      void begin(pendingLaunch.day, pendingLaunch.replay);
    }
  }, [api, pendingLaunch]);
  useEffect(() => {
    if (panel && api) void refresh();
  }, [api, panel]);
  async function refresh() {
    if (!api) return;
    try {
      setStatuses(await api.status());
    } catch (e) {
      setError(message(e));
    }
  }
  async function begin(day: number, replay: boolean, restoring = false) {
    const gen = generation.current;
    // Auto-resume and a calendar click can share a React render. Only one
    // director may own the session's checkpoint/revision stream.
    if (!api || loading || launchInFlight.current === gen) return;
    launchInFlight.current = gen;
    setLoading(true);
    setError("");
    try {
      await director.current?.flush();
      const session = await api.load(day, replay, replay && !restoring);
      const list = await api.status();
      if (gen !== generation.current) return;
      const content = session.content,
        scope = {
          userId: api.userId,
          preview: api.preview,
          runId: session.runId,
        };
      const local =
        api.mode === "private"
          ? ((await loadCheckpoint(scope, content)) as EpisodeProgress | null)
          : null;
      let progress = session.progress;
      if (local && (!progress || local.revision > progress.revision))
        progress = local;
      if (!progress)
        progress = {
          ...startEpisode(
            content,
            { day, unlocked: true },
            {
              world: scene.state,
              completedDays: api.preview
                ? content.dependsOn
                : list.filter((s) => s.complete).map((s) => s.day),
            },
          ),
          runtime: initialRuntime(),
        };
      validateRuntime(progress.runtime);
      if (api.mode === "private" && session.completedAt)
        presentation(progress).completedAt = session.completedAt;
      let remoteRevision = session.revision,
        localRevision = local?.revision ?? null;
      setStatuses(list);
      director.current?.stop();
      await startCallback.current();
      await loadNarrativeMedia(scene, content, (path, day) =>
        legacy!.media(path, day),
      );
      if (gen !== generation.current) {
        for (const m of content.flow?.media ?? []) scene.textures.remove(m.key);
        return;
      }
      const next = new NarrativeDirector(
        scene,
        content,
        progress,
        api.preview,
        async (snapshot) => {
          if (api.mode === "private") {
            await saveCheckpoint(scope, content, snapshot, localRevision);
            localRevision = snapshot.revision;
          }
          const receipt = await api.save(
            day,
            session.runId,
            remoteRevision,
            snapshot,
          );
          remoteRevision = snapshot.revision;
          if (receipt && typeof receipt.restored === "boolean")
            director.current?.acknowledge(receipt);
        },
        list.filter((s) => s.restored).length,
        list.some((s) => s.day === day && s.restored),
        api.mode === "private" && !api.preview ? "server" : "preview",
        replay,
        () => putLocal(activeKey, null),
        session.context,
      );
      director.current = next;
      await putLocal(activeKey, { day, replay });
      setPanel(false);
    } catch (e) {
      setError(message(e));
      setPanel(true);
    } finally {
      if (launchInFlight.current === gen) launchInFlight.current = null;
      if (gen === generation.current) setLoading(false);
    }
  }
  async function importScript(file: File) {
    if (!(import.meta.env.DEV && legacy?.mode !== "supabase") && !api?.adminPut)
      return;
    setError("");
    try {
      if (file.size > 200000) throw Error("Cahier compilé trop volumineux");
      const input = JSON.parse(await file.text());
      if (api?.adminPut) {
        await api.adminPut(input);
        await refresh();
      } else if (import.meta.env.DEV) {
        const { authorAPI } = await import("./author");
        setApi(await authorAPI(input));
      }
    } catch (e) {
      setError(message(e));
    }
  }
  const current = view.narrative;
  const momentButtons = current?.actions
    .filter((a) => a.id !== "continue" && a.id !== "explore")
    .map((action) => (
      <button
        key={action.id}
        onClick={() =>
          scene.narrative?.interact(`narrative:optional:${action.id}`)
        }
      >
        {action.label}
      </button>
    ));
  return (
    <>
      {current?.error && view.dialogue && (
        <aside className="narrative-save-error" role="alert">
          <p>{current.error}</p>
          <button onClick={() => director.current?.retry()}>
            Réessayer la sauvegarde
          </button>
        </aside>
      )}
      {current?.task && (
        <FlowTask
          puzzle={current.task.puzzle}
          draft={current.task.draft}
          move={(m) => scene.narrative?.puzzle?.(m)}
          close={() => scene.narrative?.puzzle?.(null)}
        />
      )}
      {current?.inspection && (
        <aside
          className="narrative-inspection"
          aria-label="Observation rapprochée"
        >
          <img src={current.inspection.src} alt={current.inspection.caption} />
          <button onClick={() => scene.narrative?.dismissInspection?.()}>
            Fermer l’image
          </button>
        </aside>
      )}
      {current && <span className="narrative-session" hidden />}
      {current && !panel && !view.cinematic && !view.dialogue && (
        <aside
          key={current.complete ? "completed" : "active"}
          className="advent-tracker narrative-tracker"
          aria-label="Aventure narrative"
        >
          <strong>
            {current.preview
              ? "Aperçu séparé"
              : current.replay
                ? "Relecture séparée"
                : "Livre des Étoiles"}{" "}
            · {current.restored}/24
          </strong>
          {!current.complete && <span>{current.title}</span>}
          {!current.complete && <small>{current.objective}</small>}
          {current.complete && (
            <small role="status">
              Jour {Number(current.episodeId.slice(-2))} terminé · Exploration
              libre
            </small>
          )}
          {current.hintLevel >= 2 && (
            <small>Un indice reste à examiner. Flocon peut vous guider.</small>
          )}
          {current.saving && <small role="status">Sauvegarde…</small>}
          {current.error && (
            <p role="alert">
              {current.error}
              <button onClick={() => director.current?.retry()}>
                Réessayer la sauvegarde
              </button>
            </p>
          )}
          <div>
            {!!momentButtons?.length && (
              <details className="narrative-moments">
                <summary>Moments à partager</summary>
                <div>{momentButtons}</div>
              </details>
            )}
            {current.actions
              .filter((a) => a.id === "continue" || a.id === "explore")
              .map((action) => (
                <button
                  key={action.id}
                  onClick={() =>
                    scene.narrative?.interact(`narrative:optional:${action.id}`)
                  }
                >
                  {action.label}
                </button>
              ))}
            <button
              aria-label="Courir"
              onPointerDown={() => {
                controls.run = true;
              }}
              onPointerUp={() => {
                controls.run = false;
              }}
              onPointerLeave={() => {
                controls.run = false;
              }}
              onPointerCancel={() => {
                controls.run = false;
              }}
            >
              Courir · Maj
            </button>
            {current.book && (
              <button onClick={() => scene.narrative?.openBook()}>
                Livre des Étoiles
              </button>
            )}
            <button
              onClick={() => {
                setPanel(true);
                void refresh();
              }}
            >
              Épisodes
            </button>
          </div>
        </aside>
      )}
      {(panel || loading) && (
        <div className="modal-backdrop advent-backdrop">
          <section
            className="advent-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Aventure narrative"
          >
            <button
              className="close"
              disabled={loading}
              onClick={() => setPanel(false)}
            >
              Retour au village ×
            </button>
            <p className="eyebrow">LES 24 ÉTOILES DE NOËL</p>
            <h2>L’aventure d’Étoilebois</h2>
            {api?.mode === "author" && (
              <p role="note">
                Atelier local de développement — non sécurisé. Contenu importé
                sur cet appareil, aperçu et sauvegarde séparés. Aucune étoile de
                production n’est attribuée.
              </p>
            )}
            {legacy?.mode === "supabase" && legacy.isAdmin && (
              <label>
                <input
                  type="checkbox"
                  checked={preview}
                  onChange={(e) => setPreview(e.target.checked)}
                />
                Aperçu administrateur séparé
              </label>
            )}
            {((import.meta.env.DEV && legacy?.mode !== "supabase") ||
              !!api?.adminPut) && (
              <label>
                Importer un cahier JSON privé
                <input
                  aria-label="Importer un cahier narratif"
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importScript(file);
                  }}
                />
              </label>
            )}
            {!api && (
              <p>
                {legacy?.mode === "supabase"
                  ? "Chargement de la session privée…"
                  : import.meta.env.DEV
                    ? "Importez un cahier compilé pour tester l’aventure locale."
                    : "L’aventure nécessite une session privée configurée."}
              </p>
            )}
            {loading && (
              <p role="status">Chargement de l’épisode et de sa sauvegarde…</p>
            )}
            {error && <p role="alert">{error}</p>}
            {api?.mode === "private" && !legacy?.isAdmin ? (
              <p>
                Le calendrier illustré existant permet de commencer ou reprendre
                une journée. Revenez au village puis ouvrez « Avent 2026 ».
              </p>
            ) : (
              <div className="advent-calendar">
                {Array.from({ length: 24 }, (_, i) => {
                  const s = statuses.find((s) => s.day === i + 1);
                  return (
                    <div key={i}>
                      <button
                        disabled={loading || !s?.available || !s.unlocked}
                        aria-label={`Commencer l’épisode ${i + 1}`}
                        onClick={() => void begin(i + 1, false)}
                      >
                        {i + 1} {s?.restored ? "✦" : "·"}
                        <small>
                          {!s?.available
                            ? "À intégrer"
                            : !s.unlocked
                              ? "Verrouillé"
                              : s.title}
                        </small>
                      </button>
                      {s?.complete && s.unlocked && (
                        <button onClick={() => void begin(i + 1, true)}>
                          Rejouer l’épisode {i + 1}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p>
              Quatre constellations de six étoiles. Aucun épisode incomplet ne
              peut être lancé.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
function message(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
