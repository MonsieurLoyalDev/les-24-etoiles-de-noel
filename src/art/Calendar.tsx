import type { CSSProperties } from "react";
import type { DayStatus } from "../advent/model";
import catalog from "./catalog.json";
export function CalendarArt({
  statuses,
  busy,
  select,
}: {
  statuses: DayStatus[];
  busy: boolean;
  select: (day: number) => void;
}) {
  return (
    <div
      className="calendar-scroll"
      tabIndex={0}
      aria-label="Calendrier illustré, défilement horizontal sur petit écran"
    >
      <div
        className="advent-calendar calendar-artboard"
        role="group"
        aria-label="Les 24 étoiles du calendrier"
      >
        {catalog.positions.map((p) => {
          const day = Number(p.jour),
            status = statuses.find((s) => s.day === day);
          const state =
            status?.complete || status?.restored
              ? "complete"
              : status?.unlocked
                ? "available"
                : "locked";
          return (
            <button
              key={day}
              className={`calendar-star ${state} ${day === 24 ? "top-star" : ""}`}
              style={{ "--x": p.x, "--y": p.y } as CSSProperties}
              aria-label={`Ouvrir le jour ${day}`}
              title={`Jour ${day} · ${state === "complete" ? "Souvenir gagné" : state === "available" ? "Disponible" : "Verrouillé"}`}
              disabled={busy || !status?.unlocked}
              onClick={() => select(day)}
            >
              <span className="star-shape" aria-hidden="true">
                ✦
              </span>
              <strong>{day}</strong>
              <span className="sr-only">
                {state === "complete"
                  ? "Souvenir gagné"
                  : state === "available"
                    ? "Découvrir"
                    : "Verrouillé"}
              </span>
              {status?.complete && <i aria-hidden="true">✓</i>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
