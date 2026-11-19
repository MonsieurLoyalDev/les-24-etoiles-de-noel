import type { MapNote } from "./flow";

/** A read-only Book inset. It never creates a portal or changes access rights. */
export function DiscoveryMap({ note }: { note: MapNote }) {
  return (
    <figure
      className="narrative-map-note"
      aria-label="Repère découvert sur la carte"
    >
      <svg
        viewBox="0 0 400 240"
        role="img"
        aria-label={`${note.to}, au-dessus de ${note.from}. Accès fermé.`}
        style={{
          display: "block",
          maxWidth: 480,
          width: "100%",
          border: "1px solid #a17b50",
        }}
      >
        <image
          href="/assets/production/theatre-forest.png"
          width="400"
          height="240"
          preserveAspectRatio="xMidYMid slice"
          opacity=".45"
        />
        <path
          d="M200 185 Q140 120 200 62"
          fill="none"
          stroke="#e4c38e"
          strokeWidth="3"
          strokeDasharray="5 7"
        />
        <path
          d="M179 68 L200 35 L223 68 Z M185 60 L200 51 L213 60"
          fill="#68798a"
          stroke="#f3e9d1"
          strokeWidth="2"
        />
        <path
          d="M193 45 L193 37 A7 7 0 0 1 207 37 L207 45 M190 45 H210 V59 H190 Z"
          fill="#705035"
          stroke="#e9c786"
          strokeWidth="2"
        />
        <circle
          cx="200"
          cy="185"
          r="6"
          fill="#e8bd78"
          stroke="#3b302a"
          strokeWidth="2"
        />
        <text
          x="200"
          y="88"
          textAnchor="middle"
          fill="#fff4dc"
          stroke="#332c29"
          strokeWidth="3"
          paintOrder="stroke"
          fontSize="15"
        >
          {note.to}
        </text>
        <text
          x="200"
          y="215"
          textAnchor="middle"
          fill="#fff4dc"
          stroke="#332c29"
          strokeWidth="3"
          paintOrder="stroke"
          fontSize="15"
        >
          {note.from}
        </text>
      </svg>
      <figcaption>Repère découvert · accès fermé</figcaption>
    </figure>
  );
}
