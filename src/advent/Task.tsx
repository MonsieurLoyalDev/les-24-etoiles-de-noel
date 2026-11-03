import { useEffect, useState, useRef } from "react";
import { Photo, MemoryGame, Wrapping } from "../ui/MiniGame";
import type { Step, Value } from "./model";
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function ToneButton({ play }: { play: () => void }) {
  return <button onClick={play}>Écouter la mélodie</button>;
}
function playNotes(notes: string[]) {
  const ctx = new AudioContext();
  void ctx.resume();
  const frequencies: Record<string, number> = {
    do: 261.63,
    mi: 329.63,
    sol: 392,
  };
  notes.forEach((note, i) => {
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.frequency.value = frequencies[note] ?? 261.63;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.4);
    osc.stop(ctx.currentTime + i * 0.4 + 0.3);
  });
  setTimeout(() => void ctx.close(), notes.length * 400 + 100);
}
type Props = {
  step: Step;
  draft: Value;
  onDraft: (v: Value) => void;
  onSubmit: (v: Value) => void;
  onHunt: () => void;
  onScene: () => void;
  sessionKey: string;
  mediaUrl?: string;
  busy: boolean;
};
export function Task({
  step,
  draft,
  onDraft,
  onSubmit,
  onHunt,
  onScene,
  sessionKey,
  mediaUrl,
  busy,
}: Props) {
  const [text, setText] = useState(typeof draft === "string" ? draft : "");
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(draft)
      ? draft.filter((x): x is string => typeof x === "string")
      : [],
  );
  const [transcript, setTranscript] = useState(false);
  const [ended, setEnded] = useState(draft === true);
  const [recipient, setRecipient] = useState("Debby"),
    [date, setDate] = useState("2026-12-24"),
    [option, setOption] = useState("");
  const [receipt, setReceipt] = useState("");
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    root.current?.querySelector<HTMLElement>("button,input,textarea")?.focus();
  }, []);
  const saveList = (next: string[]) => {
    setSelected(next);
    onDraft(next);
  };
  const toggle = (id: string) => {
    saveList(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  };
  const submit = (
    <button className="gold" disabled={busy} onClick={() => onSubmit(selected)}>
      Valider cette étape
    </button>
  );
  if (step.kind === "photo")
    return (
      <Photo
        pictureUrl={mediaUrl}
        storageKey={sessionKey}
        win={(_score, evidence) => onSubmit(evidence ?? [])}
      />
    );
  if (step.kind === "memory")
    return (
      <MemoryGame
        storageKey={sessionKey}
        win={(_score, evidence) => onSubmit(evidence ?? [])}
      />
    );
  if (step.kind === "wrap")
    return (
      <Wrapping
        storageKey={sessionKey}
        win={(_score, evidence) => onSubmit(evidence ?? [])}
      />
    );
  return (
    <div ref={root} className={`advent-task task-${step.kind}`}>
      {step.text && step.kind !== "melody" && step.kind !== "scene" && (
        <p>{step.text}</p>
      )}
      {["read", "collect", "decorate"].includes(step.kind) && (
        <>
          <div className={`advent-items ${step.style ?? ""}`}>
            {step.items?.map((item) => (
              <button
                key={item.id}
                aria-label={`Découvrir ${item.id}`}
                aria-pressed={selected.includes(item.id)}
                onClick={() => toggle(item.id)}
              >
                <span>
                  {selected.includes(item.id)
                    ? step.style === "garden"
                      ? "❀"
                      : step.style === "tree"
                        ? "✦"
                        : "♥"
                    : "✧"}
                </span>
                <strong>
                  {selected.includes(item.id)
                    ? item.label
                    : `${step.kind === "read" ? "Fragment" : "Découverte"} ${item.id}`}
                </strong>
                {selected.includes(item.id) && item.detail && (
                  <small>{item.detail}</small>
                )}
              </button>
            ))}
          </div>
          <p>
            {selected.length} / {step.items?.length} découvertes
          </p>
          {submit}
        </>
      )}
      {step.kind === "choice" && (
        <div className="advent-options">
          {step.options?.map((o) => (
            <button
              disabled={busy}
              key={o.id}
              onClick={() => {
                onDraft(o.id);
                onSubmit(o.id);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      {["input", "write"].includes(step.kind) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(text);
          }}
        >
          <label>
            {step.prompt}
            {step.kind === "write" ? (
              <textarea
                aria-label="Votre texte"
                value={text}
                maxLength={10000}
                rows={7}
                onChange={(e) => {
                  setText(e.target.value);
                  onDraft(e.target.value);
                }}
              />
            ) : (
              <input
                aria-label="Votre réponse"
                value={text}
                maxLength={10000}
                onChange={(e) => {
                  setText(e.target.value);
                  onDraft(e.target.value);
                }}
              />
            )}
          </label>
          <p>{text.length} caractères · brouillon conservé sur cet appareil</p>
          <button className="gold" disabled={busy || !text.trim()}>
            Valider cette étape
          </button>
          {step.kind === "write" && (
            <button
              type="button"
              onClick={() => downloadText("notre-lettre.txt", text)}
            >
              Garder une copie du texte
            </button>
          )}
        </form>
      )}
      {["sequence", "melody", "connect"].includes(step.kind) && (
        <>
          {step.kind === "melody" && (
            <ToneButton play={() => playNotes((step.text ?? "").split(","))} />
          )}
          <div
            className={
              step.kind === "connect" ? "constellation" : "sequence-buttons"
            }
          >
            {step.items?.map((item, i) => (
              <button
                key={item.id}
                aria-label={`Ajouter ${item.label}`}
                style={
                  step.kind === "connect"
                    ? {
                        left: `${10 + ((i * 31) % 75)}%`,
                        top: `${10 + ((i * 37) % 65)}%`,
                      }
                    : undefined
                }
                onClick={() => {
                  if (step.kind === "melody") playNotes([item.id]);
                  saveList([...selected, item.id]);
                }}
              >
                {step.kind === "connect" ? "✦ " : ""}
                {item.label}
              </button>
            ))}
          </div>
          <ol className="sequence-result">
            {selected.map((id, i) => (
              <li key={i}>{step.items?.find((x) => x.id === id)?.label}</li>
            ))}
          </ol>
          <button onClick={() => saveList([])}>Recommencer la séquence</button>
          {submit}
        </>
      )}
      {step.kind === "media" && (
        <>
          {mediaUrl &&
            (step.mediaType === "video" ? (
              <video
                controls
                src={mediaUrl}
                onEnded={() => {
                  setEnded(true);
                  onDraft(true);
                }}
                preload="metadata"
                playsInline
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Souvenir privé de la journée"
                onLoad={() => setEnded(true)}
              />
            ))}
          <button onClick={() => setTranscript((v) => !v)}>
            Lire la transcription
          </button>
          {transcript && (
            <div className="advent-items">
              {step.transcript?.map((line, i) => (
                <button
                  key={i}
                  aria-pressed={selected.includes(String(i))}
                  onClick={() =>
                    saveList([...new Set([...selected, String(i)])])
                  }
                >
                  {line}
                </button>
              ))}
            </div>
          )}
          <button
            className="gold"
            disabled={
              busy ||
              (!ended && selected.length !== (step.transcript?.length ?? -1))
            }
            onClick={() => onSubmit(true)}
          >
            J’ai découvert le film
          </button>
        </>
      )}
      {step.kind === "hunt" && (
        <>
          <p>
            Cette activité se déroule sur la place, dans le RPG. Approche chaque
            cachette et utilise E ou le bouton tactile.
          </p>
          <p>
            {selected.length} / {step.items?.length} trouvailles
          </p>
          <button className="gold" onClick={onHunt}>
            {selected.length
              ? "Reprendre la recherche"
              : "Commencer la recherche"}
          </button>
          {selected.length === (step.items?.length ?? 0) && submit}
        </>
      )}
      {step.kind === "voucher" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = { option, recipient, date };
            onDraft(value);
            setReceipt(
              `Bon pour ${step.options?.find((i) => i.id === option)?.label}\nPour ${recipient}\nLe ${date}\nSouvenir de démonstration`,
            );
            onSubmit(value);
          }}
        >
          <label>
            Destinataire
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              maxLength={80}
            />
          </label>
          <label>
            Date souhaitée
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <fieldset>
            <legend>Expérience</legend>
            {step.options?.map((o) => (
              <label key={o.id}>
                <input
                  type="radio"
                  name="experience"
                  value={o.id}
                  checked={option === o.id}
                  onChange={() => setOption(o.id)}
                  required
                />
                {o.label}
              </label>
            ))}
          </fieldset>
          <button className="gold" disabled={busy}>
            Créer mon bon cadeau
          </button>
          {receipt && (
            <button
              type="button"
              onClick={() => downloadText("bon-cadeau.txt", receipt)}
            >
              Télécharger le bon
            </button>
          )}
        </form>
      )}
      {step.kind === "story" &&
        (() => {
          let id = "start";
          for (const token of selected) {
            const node = step.story?.[id];
            const choice = node?.choices.find((c) => `${id}:${c.id}` === token);
            if (choice) id = choice.next;
          }
          const node = step.story?.[id];
          return (
            <>
              <p className="story-text">{node?.text}</p>
              {node?.choices.map((c) => (
                <button
                  key={c.id}
                  onClick={() => saveList([...selected, `${id}:${c.id}`])}
                >
                  {c.label}
                </button>
              ))}
              {id === "end" && submit}
              <button onClick={() => saveList([])}>
                Recommencer l’histoire
              </button>
            </>
          );
        })()}
      {step.kind === "scene" && (
        <>
          <p>
            Retrouve la place. Avance dans les dialogues de Loyal et Debby avec
            E ou Continuer.
          </p>
          <button className="gold" onClick={onScene}>
            Vivre la scène du 24
          </button>
          {draft === 4 && (
            <button onClick={() => onSubmit(4)}>Valider la cinématique</button>
          )}
        </>
      )}
    </div>
  );
}
