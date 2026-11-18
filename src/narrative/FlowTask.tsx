import { useState } from "react";
import {
  circuitPower,
  rotateMask,
  type Puzzle,
  type PuzzleDraft,
  type PuzzleMove,
} from "./flow";
export function FlowTask({
  puzzle: p,
  draft: d,
  move,
  close,
}: {
  puzzle: Puzzle;
  draft: PuzzleDraft;
  move: (m: PuzzleMove) => void;
  close: () => void;
}) {
  const [hint, setHint] = useState(false);
  const powered = p.circuit ? circuitPower(p.circuit, d.rotations) : null;
  return (
    <div className="modal-backdrop advent-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Activité narrative"
        className="advent-modal"
      >
        <button className="close" onClick={close}>
          Fermer l’activité
        </button>
        <h2>{p.title}</h2>
        <p>{p.prompt}</p>
        {p.kind === "circuit" && p.circuit && (
          <>
            <p role="status">
              {powered?.outputs}/{p.circuit.outputs.length} sorties alimentées
            </p>
            <div
              className="flow-circuit"
              style={{
                gridTemplateColumns: `repeat(${p.circuit.size}, minmax(50px,1fr))`,
              }}
            >
              {p.items.map((item, i) => {
                const mask = rotateMask(p.circuit!.masks[i], d.rotations[i]);
                return (
                  <button
                    key={item.id}
                    aria-label={item.label}
                    data-powered={powered?.cells.includes(i)}
                    onClick={() => move({ type: "rotate", id: item.id })}
                  >
                    <svg viewBox="0 0 60 60" aria-hidden="true">
                      <rect
                        x="2"
                        y="2"
                        width="56"
                        height="56"
                        rx="5"
                        fill="#3e3028"
                        stroke="#ad8251"
                      />
                      {[
                        [1, 30, 0],
                        [2, 60, 30],
                        [4, 30, 60],
                        [8, 0, 30],
                      ]
                        .filter(([bit]) => mask & bit)
                        .map(([bit, x, y]) => (
                          <path
                            key={bit}
                            d={`M30 30L${x} ${y}`}
                            stroke={
                              powered?.cells.includes(i) ? "#f3cf79" : "#9f7951"
                            }
                            strokeWidth="8"
                            fill="none"
                          />
                        ))}
                      <circle cx="30" cy="30" r="6" fill="#c7944c" />
                    </svg>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {p.kind === "matching" &&
          p.items.map((item) => (
            <label key={item.id} className="flow-field">
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
              {p.illustrations?.[item.id] && (
                <div className="flow-observation">
                  <figure>
                    {p.illustrations[item.id].real ? (
                      <img
                        src={p.illustrations[item.id].real}
                        alt="Paysage réel"
                      />
                    ) : (
                      <div
                        className="flow-clear-sky"
                        aria-label="Ciel sans étoile"
                      />
                    )}
                    <figcaption>Paysage réel</figcaption>
                  </figure>
                  <figure>
                    <img
                      src={p.illustrations[item.id].reflection}
                      alt="Reflet observé"
                    />
                    <figcaption>Reflet observé</figcaption>
                  </figure>
                </div>
              )}
              <select
                aria-label={item.label}
                value={String(d.values[item.id] ?? "")}
                onChange={(e) =>
                  move({ type: "match", id: item.id, value: e.target.value })
                }
              >
                <option value="">Choisir</option>
                {p.options?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        {p.kind === "dial" && (
          <div className="flow-dial" aria-label="Cadran circulaire">
            <div className="dial-hands" aria-hidden="true">
              ◷
            </div>
            {d.order.map((id, i) => (
              <div
                key={id}
                style={{
                  left: `${50 + 38 * Math.sin((i * Math.PI) / 2)}%`,
                  top: `${50 - 38 * Math.cos((i * Math.PI) / 2)}%`,
                }}
              >
                <strong>{p.items.find((v) => v.id === id)!.label}</strong>
              </div>
            ))}
            <button onClick={() => move({ type: "rotate" })}>
              Tourner le cadran
            </button>
          </div>
        )}
        {(p.kind === "order" || p.kind === "dial") && (
          <ol>
            {d.order.map((id, i) => {
              const item = p.items.find((v) => v.id === id)!;
              return (
                <li key={id} className="flow-field">
                  <strong>{item.label}</strong>
                  <p>{item.detail}</p>
                  <button
                    aria-label={`Monter ${item.label}`}
                    disabled={i === 0}
                    onClick={() => move({ type: "swap", id, value: -1 })}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Descendre ${item.label}`}
                    disabled={i === d.order.length - 1}
                    onClick={() => move({ type: "swap", id, value: 1 })}
                  >
                    ↓
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {p.kind === "sequence" && (
          <>
            <p>
              Séquence :{" "}
              {d.sequence
                .map((id) => p.items.find((i) => i.id === id)?.label)
                .join(" · ") || "—"}
            </p>
            <div className="flow-buttons">
              {p.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => move({ type: "sequence", id: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
        {p.kind === "selection" &&
          p.items.map((item) => (
            <label key={item.id} className="flow-field">
              <input
                type="checkbox"
                checked={!!d.values[item.id]}
                onChange={() => move({ type: "toggle", id: item.id })}
              />
              {item.label}
              <small>{item.detail}</small>
            </label>
          ))}
        {p.kind === "cooking" && (
          <>
            <h3>Mesurer</h3>
            {p.items.map((item) => {
              const q = p.quantities?.[item.id];
              if (!q) return null;
              return (
                <div key={item.id} className="flow-field">
                  <label>
                    {item.label} : <output>{d.values[item.id] ?? 0}</output> /{" "}
                    {q.target} {q.unit}
                  </label>
                  <button
                    aria-label={`Retirer ${item.label}`}
                    onClick={() =>
                      move({ type: "measure", id: item.id, value: -1 })
                    }
                  >
                    −
                  </button>
                  <button
                    aria-label={`Ajouter ${item.label}`}
                    onClick={() =>
                      move({ type: "measure", id: item.id, value: 1 })
                    }
                  >
                    +
                  </button>
                </div>
              );
            })}
            <h3>Mélanger</h3>
            <p>
              {d.mix}/{p.mix ?? 5} mouvements
            </p>
            <button
              disabled={
                !Object.entries(p.quantities ?? {}).every(
                  ([id, q]) => d.values[id] === q.target,
                )
              }
              onClick={() => move({ type: "mix" })}
            >
              Mélanger
            </button>
            <h3>Cuire</h3>
            <meter
              min="0"
              max="100"
              low={p.golden?.[0] ?? 60}
              high={p.golden?.[1] ?? 80}
              optimum={70}
              value={d.heat}
            />
            <p>
              {d.heat < (p.golden?.[0] ?? 60)
                ? "Pâte crue"
                : d.heat <= (p.golden?.[1] ?? 80)
                  ? "Dorés"
                  : "Trop cuits"}
            </p>
            <button
              disabled={d.mix < (p.mix ?? 5) || d.heat >= 100}
              onClick={() => move({ type: "heat" })}
            >
              Encore un peu de cuisson
            </button>
          </>
        )}
        <div className="flow-buttons">
          <button onClick={() => move({ type: "check" })}>
            {p.kind === "cooking" ? "Sortir les biscuits" : "Vérifier"}
          </button>
          <button onClick={() => setHint(!hint)}>Indice</button>
          <button onClick={() => move({ type: "reset" })}>Recommencer</button>
        </div>
        {hint && <p role="note">{p.hint}</p>}
        {d.attempts > 0 && !d.solved && (
          <p role="status">
            {p.feedback
              ? `${p.feedback.speaker} — ${p.feedback.text}`
              : "Vous pouvez corriger et réessayer, sans pénalité."}
          </p>
        )}
      </section>
    </div>
  );
}
