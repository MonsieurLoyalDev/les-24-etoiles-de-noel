import { readGame, writeGame, isBoard, validMemory } from "./miniStorage";
import { useEffect, useState } from "react";
import {
  photoStart,
  swapTiles,
  photoSolved,
  flipCard,
  shuffle,
  orders,
  matchesOrder,
  type Memory,
} from "../rpg/minigames";
export type MiniKind = "photo" | "memory" | "wrap";
export const miniNames = {
  photo: "Puzzle de photographie",
  memory: "Mémoire des souvenirs",
  wrap: "Emballage de cadeaux",
};
function Picture({ tile }: { tile: number }) {
  return (
    <svg
      viewBox={`${(tile % 3) * 100} ${Math.floor(tile / 3) * 100} 100 100`}
      aria-hidden="true"
    >
      <rect width="300" height="300" fill="#9fbed1" />
      <circle cx="240" cy="50" r="25" fill="#ffe3a5" />
      <path d="M0 170L70 60L140 170L210 95L300 185V300H0" fill="#496c72" />
      <path d="M0 230Q130 180 300 230V300H0" fill="#e3eeee" />
      <rect x="110" y="160" width="90" height="75" fill="#95665b" />
      <path d="M95 165L155 110L215 165" fill="#543a56" />
      <rect x="140" y="190" width="24" height="45" fill="#ffd28e" />
      <path d="M30 220L60 145L90 220ZM220 255L250 175L280 255" fill="#254c4e" />
      <text x="150" y="280" textAnchor="middle" fill="#495665" fontSize="15">
        Un hiver à deux
      </text>
    </svg>
  );
}
export function Photo({
  win,
  storageKey,
  pictureUrl,
}: {
  win: (score: number, evidence?: number[]) => void;
  storageKey?: string;
  pictureUrl?: string;
}) {
  const cached = readGame(storageKey);

  const [board, setBoard] = useState<number[]>(() =>
    isBoard(cached?.board) ? cached.board : photoStart,
  );
  const [selected, setSelected] = useState<number>();
  const [moves, setMoves] = useState(() =>
    typeof cached?.moves === "number" ? cached.moves : 0,
  );
  useEffect(
    () => writeGame(storageKey, { board, moves }),
    [storageKey, board, moves],
  );
  const solved = photoSolved(board);
  return (
    <>
      <p>
        Sélectionnez deux fragments pour les échanger. Les petits numéros
        indiquent leur place dans la photo finale.
      </p>
      <div className="photo-board">
        {board.map((tile, i) => (
          <button
            key={i}
            aria-label={`Case ${i + 1}, fragment ${tile + 1}`}
            aria-pressed={selected === i}
            disabled={solved}
            onClick={() => {
              if (selected === undefined) setSelected(i);
              else {
                setBoard(swapTiles(board, selected, i));
                if (selected !== i) setMoves(moves + 1);
                setSelected(undefined);
              }
            }}
          >
            {pictureUrl ? (
              <span
                className="photo-fragment"
                style={{
                  backgroundImage: `url("${pictureUrl}")`,
                  backgroundSize: "300% 300%",
                  backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%`,
                }}
              />
            ) : (
              <Picture tile={tile} />
            )}
            <small>{tile + 1}</small>
          </button>
        ))}
      </div>
      <p>
        {moves} échanges ·{" "}
        {solved
          ? "La photographie est reconstituée !"
          : "Retrouvez le paysage hivernal."}
      </p>
      {solved && (
        <button className="gold" onClick={() => win(moves, board)}>
          Recevoir le souvenir
        </button>
      )}
    </>
  );
}
export function MemoryGame({
  win,
  storageKey,
}: {
  win: (score: number, evidence?: number[]) => void;
  storageKey?: string;
}) {
  const [state, setState] = useState<Memory>(
    () =>
      validMemory(readGame(storageKey)) ?? {
        deck: shuffle([0, 0, 1, 1, 2, 2, 3, 3]),
        open: [],
        matched: [],
        moves: 0,
      },
  );
  useEffect(() => writeGame(storageKey, state), [storageKey, state]);
  useEffect(() => {
    if (state.open.length !== 2) return;
    const timer = setTimeout(() => setState((s) => ({ ...s, open: [] })), 700);
    return () => clearTimeout(timer);
  }, [state.open]);
  const symbols = ["✦", "♥", "❄", "☕"];
  const solved = state.matched.length === 8;
  return (
    <>
      <p>
        Retournez deux cartes et retrouvez les quatre paires. Aucun chronomètre
        : prenez votre temps.
      </p>
      <div className="memory-board">
        {state.deck.map((n, i) => (
          <button
            key={i}
            aria-label={`Carte ${i + 1}${state.matched.includes(i) ? ", réunie" : ""}`}
            disabled={state.matched.includes(i) || state.open.length === 2}
            onClick={() => setState((s) => flipCard(s, i))}
          >
            <span>
              {state.open.includes(i) || state.matched.includes(i)
                ? symbols[n]
                : "?"}
            </span>
          </button>
        ))}
      </div>
      <p aria-live="polite">
        {state.matched.length / 2} / 4 paires · {state.moves} essais
      </p>
      {solved && (
        <button
          className="gold"
          onClick={() => win(state.moves, state.matched)}
        >
          Recevoir le souvenir
        </button>
      )}
    </>
  );
}
export function Wrapping({
  win,
  storageKey,
}: {
  win: (score: number, evidence?: number[]) => void;
  storageKey?: string;
}) {
  const cached = readGame(storageKey);
  const [index, setIndex] = useState(() =>
      typeof cached?.index === "number" &&
      Number.isInteger(cached.index) &&
      cached.index >= 0 &&
      cached.index <= 3
        ? cached.index
        : 0,
    ),
    [paper, setPaper] = useState(""),
    [ribbon, setRibbon] = useState(""),
    [feedback, setFeedback] = useState(""),
    [attempts, setAttempts] = useState(() =>
      typeof cached?.attempts === "number" ? cached.attempts : 0,
    );
  useEffect(
    () => writeGame(storageKey, { index, attempts }),
    [storageKey, index, attempts],
  );
  const order = orders[index];
  return (
    <>
      {order ? (
        <>
          <p>
            Préparez chaque commande : choisissez le papier et le ruban
            demandés, puis emballez.
          </p>
          <div className="order">
            Commande {index + 1} / 3 : papier <strong>{order.paper}</strong>,
            ruban <strong>{order.ribbon}</strong>
          </div>
          <fieldset>
            <legend>Papier</legend>
            {["Rouge", "Bleu", "Vert"].map((p) => (
              <button
                key={p}
                aria-pressed={paper === p}
                onClick={() => setPaper(p)}
              >
                {p}
              </button>
            ))}
          </fieldset>
          <fieldset>
            <legend>Ruban</legend>
            {["Or", "Argent"].map((r) => (
              <button
                key={r}
                aria-pressed={ribbon === r}
                onClick={() => setRibbon(r)}
              >
                {r}
              </button>
            ))}
          </fieldset>
          <button
            disabled={!paper || !ribbon}
            onClick={() => {
              setAttempts(attempts + 1);
              if (matchesOrder(index, paper, ribbon)) {
                setIndex(index + 1);
                setPaper("");
                setRibbon("");
                setFeedback("Une commande prête !");
              } else
                setFeedback(
                  "Ce n’est pas la commande demandée. Réessayez sans perdre votre progression.",
                );
            }}
          >
            Emballer
          </button>
          <p role="status">{feedback}</p>
        </>
      ) : (
        <>
          <p>
            Les trois cadeaux sont prêts ! {attempts} essais. Oscar attend de
            vos nouvelles.
          </p>
          <button className="gold" onClick={() => win(attempts, [0, 1, 2])}>
            Recevoir le souvenir
          </button>
        </>
      )}
    </>
  );
}
export function MiniGame({
  kind,
  onClose,
  onWin,
}: {
  kind: MiniKind;
  onClose: () => void;
  onWin: (score: number) => void;
}) {
  return (
    <div className="modal-backdrop">
      <section
        className="mini-modal"
        role="dialog"
        aria-modal="true"
        aria-label={miniNames[kind]}
      >
        <button className="close" onClick={onClose}>
          Quitter le jeu ×
        </button>
        <p className="eyebrow">SOUVENIR DE DÉMONSTRATION</p>
        <h2>{miniNames[kind]}</h2>
        {kind === "photo" ? (
          <Photo win={onWin} />
        ) : kind === "memory" ? (
          <MemoryGame win={onWin} />
        ) : (
          <Wrapping win={onWin} />
        )}
        <p className="note">
          Vous pouvez rejouer. Quitter recommence cette manche ; les souvenirs
          déjà gagnés restent sauvegardés.
        </p>
      </section>
    </div>
  );
}
