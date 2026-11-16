import { CalendarArt } from "../art/Calendar";
import { NarrativeHub } from "../narrative/Hub";
import { useEffect, useRef, useState } from "react";
import type { Village, View } from "../game/Game";
import { controls } from "../game/Game";
import { roomNames } from "../rpg/world";
import type { AdventAPI } from "./api";
import {
  validateEditable,
  type Day,
  type DayStatus,
  type EditableDay,
  type Run,
  type Value,
} from "./model";
import { draftKey, getLocal, putLocal, type Drafts } from "./local";
import { Task, downloadText } from "./Task";
import { createPrivateAPI, supabaseClient } from "./supabase";
import { privateLogin } from "./auth";
import { Captcha } from "./Captcha";
type Panel = "calendar" | "activity" | "admin" | "auth" | null;
export function AdventHub({
  scene,
  view,
  openRequest,
  onBusy,
}: {
  scene: Village;
  view: View;
  openRequest: number;
  onBusy: (b: boolean) => void;
}) {
  const privateMode = import.meta.env.VITE_APP_MODE === "supabase";
  const captchaKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
  const [captchaToken, setCaptchaToken] = useState(""),
    [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [api, setApi] = useState<AdventAPI>();
  const [narrativeOpen, setNarrativeOpen] = useState(0),
    [narrativeBusy, setNarrativeBusy] = useState(false);
  const [panel, setPanel] = useState<Panel>(null),
    [preview, setPreview] = useState(false),
    [statuses, setStatuses] = useState<DayStatus[]>([]),
    [definition, setDefinition] = useState<Day | null>(null),
    [run, setRun] = useState<Run | null>(null),
    [drafts, setDrafts] = useState<Drafts>({}),
    [arrived, setArrived] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [mediaUrl, setMediaUrl] = useState<string>(),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [editor, setEditor] = useState<EditableDay>(),
    [editorText, setEditorText] = useState(""),
    [editorDay, setEditorDay] = useState(1);
  const requested = useRef(view.adventRequested),
    finalDone = useRef(view.finalCompleted),
    lock = useRef(false),
    generation = useRef(0),
    lastUser = useRef<string | null>(null),
    root = useRef<HTMLDivElement>(null);
  const activeKey = api
    ? `advent-c:active:${api.mode}:${api.userId}:${preview ? "preview" : "live"}`
    : "";
  const storage =
    api && run ? draftKey(api.userId, preview, run.day, run.runId) : "";
  const step = definition?.steps[run?.checked.length ?? 0];
  const earned = statuses.filter((s) => s.complete).map((s) => s.day);
  async function initialize() {
    const gen = ++generation.current;
    try {
      let next: AdventAPI;
      if (import.meta.env.VITE_APP_MODE === "supabase")
        next = await createPrivateAPI();
      else {
        const { createDemoAPI } = await import("./demoApi");
        next = createDemoAPI(import.meta.env.DEV);
      }
      if (gen !== generation.current) return;
      setApi(next);
      setError("");
      setPanel((p) => (p === "auth" ? "calendar" : p));
    } catch (e) {
      if (gen === generation.current) {
        setApi(undefined);
        setError(message(e));
      }
    }
  }
  useEffect(() => {
    void initialize();
    if (!privateMode) return;
    let unsubscribe = () => {};
    try {
      const { data } = supabaseClient().auth.onAuthStateChange(
        (_event, session) => {
          const id = session?.user.id ?? null;
          if (id !== lastUser.current) {
            lastUser.current = id;
            setDefinition(null);
            setRun(null);
            setDrafts({});
            setStatuses([]);
            setPassword("");
            scene.clearHunt();
            setEditor(undefined);
            setEditorText("");
            setApi(undefined);
            setPreview(false);
            if (!id) setPanel("auth");
            setTimeout(() => void initialize(), 0);
          }
        },
      );
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (e) {
      setError(message(e));
    }
    return () => {
      generation.current++;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    const paused = !!panel || view.cinematic || narrativeBusy;
    controls.paused = paused;
    controls.x = 0;
    controls.y = 0;
    scene.input.keyboard?.resetKeys();
    onBusy(paused);
    if (panel)
      root.current
        ?.querySelector<HTMLElement>("button,input,textarea")
        ?.focus({ preventScroll: true });
  }, [panel, view.cinematic, narrativeBusy, scene, onBusy]);
  useEffect(() => {
    if (!openRequest) return;
    setPanel(api ? "calendar" : privateMode ? "auth" : "calendar");
    setError("");
    if (api) void refresh();
  }, [openRequest]);
  async function refresh() {
    if (!api) return;
    try {
      const list = await api.status(preview);
      setStatuses(list);
      return list;
    } catch (e) {
      setError(message(e));
    }
  }
  useEffect(() => {
    if (!api) return;
    let live = true;
    void api
      .status(preview)
      .then(async (list) => {
        if (!live) return;
        setStatuses(list);
        const active = await getLocal<number>(activeKey);
        if (active && list.find((x) => x.day === active)?.unlocked) {
          const day = await api.day(active, preview),
            state = await api.start(active, preview);
          if (!live) return;
          setDefinition(day);
          setRun(state);
          setDrafts(
            (await getLocal<Drafts>(
              draftKey(api.userId, preview, active, state.runId),
            )) ?? {},
          );
          setArrived(false);
        } else {
          setDefinition(null);
          setRun(null);
        }
      })
      .catch((e) => {
        if (live) setError(message(e));
      });
    return () => {
      live = false;
    };
  }, [api, preview]);
  useEffect(() => {
    if (panel !== "calendar" || !api) return;
    const timer = setInterval(() => void refresh(), 5000);
    return () => clearInterval(timer);
  }, [panel, api, preview]);
  useEffect(() => {
    scene.setAdventDay(definition);
  }, [scene, definition]);
  useEffect(() => {
    scene.setAdventLights(earned);
  }, [scene, earned.join(",")]);
  useEffect(() => {
    if (view.adventRequested === requested.current) return;
    requested.current = view.adventRequested;
    if (definition && run) {
      setArrived(true);
      setPanel("activity");
    }
  }, [view.adventRequested]);
  useEffect(() => {
    if (!step || step.kind !== "hunt" || !scene.hunt || !view.huntFound.length)
      return;
    saveDraft(view.huntFound, step.id);
  }, [JSON.stringify(view.huntFound)]);
  useEffect(() => {
    if (view.finalCompleted === finalDone.current) return;
    finalDone.current = view.finalCompleted;
    if (step?.kind === "scene") {
      saveDraft(4, step.id);
      setPanel("activity");
      setArrived(true);
      void submit(4);
    }
  }, [view.finalCompleted]);
  useEffect(() => {
    setMediaUrl(undefined);
    if (!step?.mediaPath || !api || panel !== "activity" || !arrived) return;
    let live = true;
    void api
      .media(step.mediaPath, definition!.day)
      .then((url) => {
        if (live) setMediaUrl(url);
      })
      .catch((e) => setError(message(e)));
    return () => {
      live = false;
    };
  }, [api, definition?.day, step?.id, step?.mediaPath, panel, arrived]);
  function saveDraft(value: Value, id = step?.id) {
    if (!storage || !id) return;
    setDrafts((previous) => {
      const next = { ...previous, [id]: value };
      void putLocal(storage, next).catch(() =>
        setNotice("Brouillon en mémoire : stockage local indisponible."),
      );
      return next;
    });
  }
  async function selectDay(day: number, replay = false) {
    if (!api) return;
    setBusy(true);
    setError("");
    try {
      scene.clearHunt();
      const d = await api.day(day, preview),
        r = await api.start(day, preview, replay);
      setDefinition(d);
      setRun(r);
      setDrafts(
        (await getLocal<Drafts>(draftKey(api.userId, preview, day, r.runId))) ??
          {},
      );
      await putLocal(activeKey, day);
      setArrived(false);
      setPanel("activity");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit(value: Value) {
    if (!api || !definition || !run || !step || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api.check(
        definition.day,
        run.runId,
        step.id,
        value,
        preview,
      );
      setRun(result.run);
      if (result.accepted) {
        setNotice("Étape validée.");
        scene.clearHunt();
        await refresh();
      } else
        setError(
          "Ce n’est pas encore la bonne réponse ou l’objectif est incomplet. Tu peux réessayer.",
        );
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function loadEditor(day: number) {
    if (!api?.isAdmin) return;
    try {
      const d = await api.adminGet(day);
      setEditor(d);
      setEditorText(JSON.stringify(d, null, 2));
      setEditorDay(day);
      setPanel("admin");
      setError("");
    } catch (e) {
      setError(message(e));
    }
  }
  function changeEditor(next: EditableDay) {
    setEditor(next);
    setEditorText(JSON.stringify(next, null, 2));
  }
  async function saveEditor() {
    if (!api || !editor) return;
    setBusy(true);
    try {
      const parsed = validateEditable(JSON.parse(editorText));
      await api.adminSave(parsed);
      await loadEditor(parsed.content.day);
      setNotice(
        "Personnalisation enregistrée. Les étoiles déjà gagnées sont conservées.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const close = () => {
    setPanel(null);
    setError("");
    setNotice("");
  };
  return (
    <>
      <NarrativeHub
        api={api}
        scene={scene}
        view={view}
        openRequest={narrativeOpen}
        onBusy={setNarrativeBusy}
        onStart={() => {
          setDefinition(null);
          setRun(null);
          scene.setAdventDay(null);
        }}
      />
      {definition && <span className="advent-session" hidden />}
      {definition && !panel && !view.cinematic && (
        <aside className="advent-tracker" aria-label="Quête de l’Avent">
          <strong>
            ✦ {preview ? "Aperçu développeur" : "Avent 2026"} · {earned.length}
            /24
          </strong>
          <span>
            Jour {definition.day} · {definition.title}
          </span>
          <small>
            {scene.hunt
              ? `Recherche : ${view.huntFound.length}/${step?.items?.length ?? 3}`
              : `Rejoindre ${roomNames[definition.room]}, puis la lueur « Jour ${definition.day} ».`}
          </small>
          <button
            onClick={() => {
              setPanel("activity");
              setArrived(false);
            }}
          >
            Voir l’objectif
          </button>
        </aside>
      )}
      {panel && (
        <div className="modal-backdrop advent-backdrop" ref={root}>
          <section
            className="advent-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              panel === "admin"
                ? "Éditeur des surprises"
                : panel === "auth"
                  ? "Connexion privée"
                  : "Calendrier de l’Avent"
            }
          >
            <button className="close" onClick={close}>
              Retour au village ×
            </button>
            <p className="eyebrow">LES 24 ÉTOILES DE NOËL · 2026</p>
            <p className={`mode-banner ${privateMode ? "private" : "demo"}`}>
              {privateMode
                ? "Mode privé Supabase · accès et dates contrôlés par le serveur."
                : "DÉMONSTRATION FICTIVE · données locales non sécurisées. Ne pas y placer de vrais souvenirs privés."}
              {preview &&
                " · APERÇU DÉVELOPPEUR : progression séparée des étoiles réelles."}
            </p>
            {error && (
              <p role="alert" className="advent-error">
                {error}
              </p>
            )}
            {notice && <p role="status">{notice}</p>}
            {panel === "auth" ? (
              <>
                <h2>Une aventure privée</h2>
                <p>
                  Utilisez un compte invité par l’administrateur. Aucune
                  inscription publique dans le jeu.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    try {
                      await privateLogin(
                        supabaseClient(),
                        email,
                        password,
                        captchaToken,
                        !!captchaKey,
                      );
                      setPassword("");
                      await initialize();
                    } catch (e) {
                      setError(message(e));
                    } finally {
                      setBusy(false);
                      setCaptchaToken("");
                      setCaptchaAttempt((n) => n + 1);
                    }
                  }}
                >
                  <label>
                    Adresse e-mail
                    <input
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Mot de passe
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>
                  {captchaKey && (
                    <Captcha
                      key={captchaAttempt}
                      siteKey={captchaKey}
                      onToken={setCaptchaToken}
                    />
                  )}
                  <button disabled={busy || (!!captchaKey && !captchaToken)}>
                    Se connecter
                  </button>
                </form>
              </>
            ) : !api ? (
              <>
                <h2>Calendrier indisponible</h2>
                <p>
                  {privateMode
                    ? "Renseigner les variables Supabase et inviter les comptes. Le jeu ne bascule pas silencieusement en mode démo."
                    : "Initialisation du calendrier…"}
                </p>
                {privateMode && (
                  <button onClick={() => setPanel("auth")}>
                    Connexion privée
                  </button>
                )}
              </>
            ) : panel === "calendar" ? (
              <>
                <h2>24 journées à vivre ensemble</h2>
                <p>
                  Ouverture du 1er au 24 décembre 2026 à minuit, heure de Paris.
                  Les jours ouverts restent rejouables.
                </p>
                <div className="advent-toolbar">
                  <button
                    onClick={() => {
                      close();
                      setNarrativeOpen((n) => n + 1);
                    }}
                  >
                    Aventure narrative
                  </button>
                  <button onClick={() => void refresh()}>
                    Actualiser les journées
                  </button>
                  {api.developerAllowed && (
                    <button
                      aria-pressed={preview}
                      onClick={() => {
                        scene.clearHunt();
                        setDefinition(null);
                        setRun(null);
                        setPreview((v) => !v);
                        setError("");
                      }}
                    >
                      {preview
                        ? "Revenir au calendrier daté"
                        : "Mode développeur : tester les 24 journées"}
                    </button>
                  )}
                  {api.isAdmin && (
                    <button onClick={() => void loadEditor(editorDay)}>
                      {api.mode === "demo"
                        ? "Éditeur fictif"
                        : "Administration des surprises"}
                    </button>
                  )}
                  {api.mode === "supabase" && (
                    <button
                      onClick={() => void supabaseClient().auth.signOut()}
                    >
                      Se déconnecter
                    </button>
                  )}
                </div>
                {api.mode === "supabase" && (
                  <details>
                    <summary>
                      Mon compte privé · définir mon mot de passe
                    </summary>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setBusy(true);
                        try {
                          const result = await supabaseClient().auth.updateUser(
                            { password },
                          );
                          if (result.error) throw result.error;
                          setPassword("");
                          setNotice("Mot de passe mis à jour.");
                        } catch (e) {
                          setError(message(e));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <label>
                        Nouveau mot de passe
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={12}
                          required
                        />
                      </label>
                      <button disabled={busy}>
                        Enregistrer mon mot de passe
                      </button>
                    </form>
                  </details>
                )}
                <CalendarArt
                  statuses={statuses}
                  busy={busy}
                  select={(day) => void selectDay(day)}
                />
                <h3>Journal des souvenirs · {earned.length}/24</h3>
                <div className="memory-journal">
                  {statuses
                    .filter((s) => s.complete)
                    .map((s) => (
                      <article key={s.day}>
                        <strong>Jour {s.day} · étoile gagnée</strong>
                        <button onClick={() => void selectDay(s.day, true)}>
                          Rejouer le jour {s.day}
                        </button>
                        <button
                          onClick={() => {
                            const memory = s.run?.memory ?? s.run?.values ?? {};
                            downloadText(
                              `souvenir-${s.day}.txt`,
                              Object.entries(memory)
                                .map(
                                  ([id, value]) =>
                                    `${id}\n${typeof value === "string" ? value : JSON.stringify(value, null, 2)}`,
                                )
                                .join("\n\n"),
                            );
                          }}
                        >
                          Garder une copie
                        </button>
                      </article>
                    ))}
                </div>
              </>
            ) : panel === "activity" && definition && run ? (
              <>
                <p className="eyebrow">
                  JOUR {definition.day} · {roomNames[definition.room]}
                </p>
                <h2>{definition.title}</h2>
                <p>{definition.intro}</p>
                <p className="advent-progress">
                  {run.checked.length}/{definition.steps.length} objectifs
                  validés · Récompense : {definition.reward}
                </p>
                {run.checked.length === definition.steps.length ? (
                  <div className="advent-reward">
                    <span>✦</span>
                    <h3>Souvenir gagné !</h3>
                    <p>{definition.reward}</p>
                    <button
                      onClick={() => void selectDay(definition.day, true)}
                    >
                      Rejouer cette journée
                    </button>
                    <button onClick={() => setPanel("calendar")}>
                      Ouvrir le journal des souvenirs
                    </button>
                    <button
                      onClick={() =>
                        downloadText(
                          `souvenir-${definition.day}.txt`,
                          `${definition.title}\n${definition.reward}\n\n${Object.entries(
                            run.memory,
                          )
                            .map(
                              ([id, v]) =>
                                `${id}: ${typeof v === "string" ? v : JSON.stringify(v, null, 2)}`,
                            )
                            .join("\n")}`,
                        )
                      }
                    >
                      Télécharger mon souvenir
                    </button>
                    {definition.day === 24 && (
                      <button
                        onClick={() => {
                          scene.startFinal(
                            definition.steps.find((s) => s.kind === "scene")
                              ?.text ?? "Inventons la suite, ensemble. ♥",
                          );
                          setPanel(null);
                        }}
                      >
                        Revoir la scène finale
                      </button>
                    )}
                  </div>
                ) : !arrived ? (
                  <>
                    <h3>Objectif : {step?.prompt}</h3>
                    <p>
                      Rejoins {roomNames[definition.room]} et approche la lueur
                      « Jour {definition.day} ». Appuie sur E ou sur le bouton
                      d’interaction pour commencer.
                    </p>
                    <button className="gold" onClick={close}>
                      Suivre la quête dans le village
                    </button>
                    <button onClick={() => setPanel("calendar")}>
                      Choisir une autre journée
                    </button>
                  </>
                ) : (
                  step && (
                    <>
                      <h3>Objectif : {step.prompt}</h3>
                      <Task
                        key={`${run.runId}:${step.id}`}
                        step={step}
                        draft={drafts[step.id] ?? null}
                        onDraft={saveDraft}
                        onSubmit={(v) => void submit(v)}
                        onHunt={() => {
                          scene.startHunt(
                            step,
                            Array.isArray(drafts[step.id])
                              ? (drafts[step.id] as string[])
                              : [],
                          );
                          close();
                        }}
                        onScene={() => {
                          scene.startFinal(
                            step.text ?? "Inventons la suite, ensemble. ♥",
                          );
                          close();
                        }}
                        sessionKey={`${api.userId}:${preview}:${definition.day}:${run.runId}:${step.id}`}
                        mediaUrl={mediaUrl}
                        busy={busy}
                      />
                    </>
                  )
                )}
              </>
            ) : panel === "admin" && editor ? (
              <>
                <h2>
                  {api.mode === "demo"
                    ? "Personnalisation fictive"
                    : "Édition administrateur"}
                </h2>
                <label>
                  Journée
                  <select
                    value={editorDay}
                    onChange={(e) => void loadEditor(Number(e.target.value))}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        Jour {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Titre
                  <input
                    value={editor.content.title}
                    onChange={(e) =>
                      changeEditor({
                        ...editor,
                        content: { ...editor.content, title: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Introduction
                  <textarea
                    value={editor.content.intro}
                    onChange={(e) =>
                      changeEditor({
                        ...editor,
                        content: { ...editor.content, intro: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Récompense
                  <input
                    value={editor.content.reward}
                    onChange={(e) =>
                      changeEditor({
                        ...editor,
                        content: { ...editor.content, reward: e.target.value },
                      })
                    }
                  />
                </label>
                {editor.content.steps.map((s, index) => (
                  <fieldset key={s.id}>
                    <legend>
                      {s.id} · {s.kind}
                    </legend>
                    <label>
                      Objectif
                      <input
                        value={s.prompt}
                        onChange={(e) => {
                          const steps = [...editor.content.steps];
                          steps[index] = { ...s, prompt: e.target.value };
                          changeEditor({
                            ...editor,
                            content: { ...editor.content, steps },
                          });
                        }}
                      />
                    </label>
                    {["input", "choice", "write"].includes(s.kind) && (
                      <label>
                        Réponse attendue (identifiant pour un choix)
                        <input
                          value={
                            typeof editor.rules[s.id]?.expected === "string"
                              ? (editor.rules[s.id].expected as string)
                              : ""
                          }
                          onChange={(e) => {
                            const rule = { ...editor.rules[s.id] };
                            if (e.target.value) rule.expected = e.target.value;
                            else delete rule.expected;
                            changeEditor({
                              ...editor,
                              rules: { ...editor.rules, [s.id]: rule },
                            });
                          }}
                        />
                      </label>
                    )}
                    <label>
                      Texte ou message final
                      <textarea
                        value={s.text ?? ""}
                        onChange={(e) => {
                          const steps = [...editor.content.steps];
                          steps[index] = { ...s, text: e.target.value };
                          changeEditor({
                            ...editor,
                            content: { ...editor.content, steps },
                          });
                        }}
                      />
                    </label>
                    <label>
                      Média privé de la journée
                      <input
                        value={s.mediaPath ?? ""}
                        placeholder={`${editorDay}/identifiant.mp4`}
                        onChange={(e) => {
                          const steps = [...editor.content.steps];
                          steps[index] = {
                            ...s,
                            mediaPath: e.target.value || undefined,
                          };
                          changeEditor({
                            ...editor,
                            content: { ...editor.content, steps },
                          });
                        }}
                      />
                    </label>
                    {api.mode === "supabase" && (
                      <label>
                        Importer une image ou vidéo privée
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setBusy(true);
                            try {
                              const path = await api.upload(editorDay, file);
                              const steps = [...editor.content.steps];
                              steps[index] = {
                                ...s,
                                mediaPath: path,
                                mediaType: file.type.startsWith("video")
                                  ? "video"
                                  : "image",
                              };
                              changeEditor({
                                ...editor,
                                content: { ...editor.content, steps },
                              });
                              setNotice(
                                "Média privé importé. Enregistrer la journée pour l’associer.",
                              );
                            } catch (e) {
                              setError(message(e));
                            } finally {
                              setBusy(false);
                            }
                          }}
                        />
                      </label>
                    )}
                  </fieldset>
                ))}
                <details>
                  <summary>
                    Configuration complète : textes, cartes, énigmes, réponses
                    et récompenses
                  </summary>
                  <label>
                    Configuration JSON
                    <textarea
                      className="json-editor"
                      aria-label="Configuration JSON"
                      value={editorText}
                      onChange={(e) => setEditorText(e.target.value)}
                    />
                  </label>
                  <button
                    onClick={() => {
                      try {
                        changeEditor(validateEditable(JSON.parse(editorText)));
                        setError("");
                      } catch (e) {
                        setError(message(e));
                      }
                    }}
                  >
                    Appliquer le JSON au formulaire
                  </button>
                </details>
                <div className="advent-toolbar">
                  <button
                    className="gold"
                    disabled={busy}
                    onClick={() => void saveEditor()}
                  >
                    Enregistrer la surprise
                  </button>
                  <button
                    onClick={() =>
                      downloadText(`jour-${editorDay}.json`, editorText)
                    }
                  >
                    Exporter le JSON
                  </button>
                  <label className="file-button">
                    Importer un JSON
                    <input
                      type="file"
                      accept="application/json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const d = validateEditable(
                            JSON.parse(await file.text()),
                          );
                          setEditorDay(d.content.day);
                          changeEditor(d);
                        } catch (e) {
                          setError(message(e));
                        }
                      }}
                    />
                  </label>
                  <button onClick={() => setPanel("calendar")}>
                    Retour au calendrier
                  </button>
                </div>
                <p>
                  Les réponses restent dans les règles privées. Aucun HTML n’est
                  exécuté. Une mise à jour ne retire pas les étoiles acquises ;
                  une manche modifiée peut devoir être recommencée.
                </p>
              </>
            ) : null}
          </section>
        </div>
      )}
    </>
  );
}
function message(e: unknown) {
  return e instanceof Error ? e.message : "Une erreur est survenue. Réessayez.";
}
