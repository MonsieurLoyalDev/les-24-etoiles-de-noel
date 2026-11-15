export type ActivityPhase =
  | "idle"
  | "moving"
  | "approaching"
  | "aligning"
  | "acting"
  | "finishing"
  | "interrupted";
export type Clip = {
  id: string;
  sheet: string;
  category: "activity" | "reaction" | "social" | "special";
  orientation: "front-right" | "back-right";
  interruptible: boolean;
  opening: number[];
  loop: number[];
  closing: number[];
  openingMs: number;
  closingMs: number;
  frameMs: number;
  loopOnce?: boolean;
  posture?: "standing" | "seated";
  interruptedFrame?: number;
  maxDuration?: number;
  commitAt?: number;
  object: "book" | "letter" | "tool" | null;
};
export const clips: Record<string, Clip> = {
  read: {
    id: "read",
    sheet: "celestine",
    category: "activity",
    orientation: "front-right",
    interruptible: true,
    opening: [0, 1],
    loop: [2, 3, 4, 5, 2, 2],
    closing: [6, 7],
    openingMs: 1300,
    closingMs: 1200,
    frameMs: 600,
    object: "book",
  },
  sort: {
    id: "sort",
    sheet: "celestine",
    category: "activity",
    orientation: "back-right",
    interruptible: true,
    opening: [8, 9],
    loop: [10, 11, 8, 9],
    closing: [11, 8],
    openingMs: 1800,
    closingMs: 1100,
    frameMs: 1000,
    object: "book",
  },
  seatRead: {
    id: "seatRead",
    posture: "seated",
    interruptedFrame: 15,
    sheet: "celestine",
    category: "activity",
    orientation: "front-right",
    interruptible: true,
    opening: [12, 13],
    loop: [13, 13, 14, 13],
    closing: [15, 12],
    openingMs: 1500,
    closingMs: 1400,
    frameMs: 850,
    object: "book",
  },
  delivery: {
    id: "delivery",
    loopOnce: true,
    sheet: "emile",
    category: "activity",
    orientation: "front-right",
    interruptible: true,
    opening: [0, 1, 2, 3],
    loop: [4, 5, 6],
    closing: [7],
    openingMs: 3200,
    closingMs: 1200,
    frameMs: 750,
    object: "letter",
    maxDuration: 7000,
  },
  mail: {
    id: "mail",
    sheet: "emile",
    category: "activity",
    orientation: "front-right",
    interruptible: true,
    opening: [8],
    loop: [9, 10, 9],
    closing: [11, 12],
    openingMs: 700,
    closingMs: 1000,
    frameMs: 900,
    object: "letter",
    maxDuration: 5000,
  },
  greet: {
    id: "greet",
    sheet: "emile",
    category: "social",
    orientation: "front-right",
    interruptible: true,
    opening: [12],
    loop: [13, 14],
    closing: [12],
    openingMs: 150,
    closingMs: 150,
    frameMs: 350,
    object: null,
    maxDuration: 1300,
  },
  inspect: {
    id: "inspect",
    sheet: "augustin",
    category: "activity",
    orientation: "front-right",
    interruptible: true,
    opening: [0, 1],
    loop: [2, 2, 1],
    closing: [6, 7],
    openingMs: 1000,
    closingMs: 1200,
    frameMs: 900,
    object: "tool",
    maxDuration: 6000,
  },
  light: {
    id: "light",
    loopOnce: true,
    sheet: "augustin",
    category: "activity",
    orientation: "front-right",
    interruptible: true,
    opening: [0, 1, 2],
    loop: [3, 4, 5],
    closing: [6, 7],
    openingMs: 2000,
    closingMs: 1500,
    frameMs: 650,
    object: "tool",
    maxDuration: 6000,
    commitAt: 2650,
  },
  extinguish: {
    id: "extinguish",
    loopOnce: true,
    sheet: "augustin",
    category: "activity",
    orientation: "front-right",
    interruptible: true,
    opening: [8],
    loop: [9, 10],
    closing: [11],
    openingMs: 1300,
    closingMs: 1200,
    frameMs: 800,
    object: "tool",
    maxDuration: 5000,
    commitAt: 2100,
  },
  warm: {
    id: "warm",
    sheet: "augustin",
    category: "reaction",
    orientation: "front-right",
    interruptible: true,
    opening: [12],
    loop: [13, 14, 13],
    closing: [12],
    openingMs: 400,
    closingMs: 500,
    frameMs: 650,
    object: null,
    maxDuration: 4000,
  },
};
export function sampleClip(
  clip: Clip,
  age: number,
  total: number,
  reduced = false,
) {
  const end = Math.max(clip.openingMs + 500, total - clip.closingMs);
  let phase: ActivityPhase = "acting",
    frames = clip.loop,
    index: number;
  if (age < 300) {
    phase = "aligning";
    frames = clip.opening;
    index = 0;
  } else if (age < clip.openingMs) {
    phase = "approaching";
    frames = clip.opening;
    index = Math.min(
      frames.length - 1,
      Math.floor((age / clip.openingMs) * frames.length),
    );
  } else if (age >= end) {
    phase = "finishing";
    frames = clip.closing;
    index = Math.min(
      frames.length - 1,
      Math.floor(((age - end) / Math.max(1, total - end)) * frames.length),
    );
  } else
    index = clip.loopOnce
      ? Math.min(
          frames.length - 1,
          Math.floor((age - clip.openingMs) / clip.frameMs),
        )
      : Math.floor((age - clip.openingMs) / clip.frameMs) % frames.length;
  return {
    phase,
    frame: reduced ? clip.loop[0] : frames[index],
    clip: clip.id,
    object: clip.object,
  };
}
