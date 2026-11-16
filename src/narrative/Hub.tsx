import { useEffect, useRef, useState } from "react";
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
    generation = useRef(0),
    lastRequest = useRef(openRequest),
    startCallback = useRef(onStart);
  startCallback.current = onStart;
  const activeKey = api
    ? `narrative:active:${api.mode}:${api.userId}:${api.preview ? "preview" : "player"}`
    : "";
  useEffect(() => {
    onBusy(panel || loading);
  }, [panel, loading, onBusy]);
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
    if (!api || loading) return;
    const gen = generation.current;
    setLoading(true);
    setError("");
    try {
      await director.current?.flush();
      const session = await api.load(day, replay, replay && !restoring);
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
              completedDays: statuses
                .filter((s) => s.complete)
                .map((s) => s.day),
            },
          ),
          runtime: initialRuntime(),
        };
      validateRuntime(progress.runtime);
      if (api.mode === "private" && session.completedAt)
        presentation(progress).completedAt = session.completedAt;
      let remoteRevision = session.revision,
        localRevision = local?.revision ?? null;
      const list = await api.status();
      setStatuses(list);
      director.current?.stop();
      await startCallback.current();
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
      );
      director.current = next;
      await putLocal(activeKey, { day, replay });
      setPanel(false);
    } catch (e) {
      setError(message(e));
      setPanel(true);
    } finally {
      setLoading(false);
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
  return (
    <>
      {current && <span className="narrative-session" hidden />}
      {current && !panel && !view.cinematic && !view.dialogue && (
        <aside
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
          <span>{current.title}</span>
          <small>{current.objective}</small>
          {current.actions.some((a) => a.id === "hug") && (
            <small>
              Moments tendres : poses debout existantes. Gestes de couple
              dessinés à valider.
            </small>
          )}
          {current.complete && (
            <p role="status">
              Jour 1 terminé · La première étoile a retrouvé sa place.
            </p>
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
            {current.actions.map((action) => (
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
