import { clips, sampleClip, type ActivityPhase } from "./activity-clips";
import type { LivingActor } from "./runtime";
import type { LanternCoordinator } from "./lanterns";
export const activityBindings: Record<
  string,
  { clip: string; flip?: boolean }
> = {
  "mira:library-reading": { clip: "read" },
  "mira:library-shelves": { clip: "sort" },
  "mira:library-armchair": { clip: "seatRead" },
  "emile:mail-books": { clip: "delivery" },
  "emile:mail-families": { clip: "delivery" },
  "emile:post-start": { clip: "mail" },
  "noe:plaza-market-lantern": { clip: "lantern", flip: true },
  "noe:plaza-gifts-lantern": { clip: "lantern" },
  "noe:plaza-evening-lantern": { clip: "lantern", flip: true },
  "noe:plaza-quiet": { clip: "warm" },
};
export type ActivitySample = {
  actor: string;
  phase: ActivityPhase;
  clip: string | null;
  frame: number | null;
  object: string | null;
  flip: boolean;
  age: number;
  total: number;
  seatProgress: number;
  interrupted: boolean;
  reason?: string;
};
type Session = {
  key: string;
  clip: string;
  flip: boolean;
  point: string;
  committed: boolean;
  reason?: string;
};
export class ActivityDirector {
  private sessions = new Map<string, Session>();
  private states = new Map<string, ActivitySample>();
  update(
    actors: Iterable<LivingActor>,
    clock: number,
    delta: number,
    lanterns: LanternCoordinator,
  ) {
    for (const a of actors) {
      const state: ActivitySample = {
        actor: a.id,
        phase: a.state === "WALKING" ? "moving" : "idle",
        clip: null,
        frame: null,
        object: null,
        flip: false,
        age: 0,
        total: 0,
        seatProgress: 0,
        interrupted: false,
      };
      if (a.reaction) {
        const clip = clips[a.reaction.clip];
        const sample = sampleClip(clip, a.reaction.age, a.reaction.duration);
        this.states.set(a.id, {
          ...state,
          ...sample,
          flip: a.reaction.flip,
          age: a.reaction.age,
          total: a.reaction.duration,
        });
        continue;
      }
      const stopped =
          a.state === "OBSERVING" ||
          a.state === "RESTING" ||
          a.state === "TALKING_TO_PLAYER",
        point = a.intent?.point ?? "",
        binding = activityBindings[a.id + ":" + point];
      if (!stopped || !binding) {
        if (this.sessions.delete(a.id)) lanterns.release(a.id);
        this.states.set(a.id, state);
        continue;
      }
      const key = [a.phase, a.visits, point].join(":");
      let session = this.sessions.get(a.id);
      if (!session || session.key !== key) {
        lanterns.release(a.id);
        let id = binding.clip,
          reason: string | undefined;
        if (id === "lantern") {
          const desired = a.phase === 2 ? true : a.phase === 0 ? false : null;
          if (desired !== null && lanterns.reserve(point, a.id, desired))
            id = desired ? "light" : "extinguish";
          else {
            id = "inspect";
            reason =
              desired === null
                ? "inspection prévue"
                : "état déjà atteint, inspection uniquement";
          }
        }
        session = {
          key,
          clip: id,
          flip: !!binding.flip,
          point,
          committed: false,
          reason,
        };
        this.sessions.set(a.id, session);
      }
      const clip = clips[session.clip],
        age = a.arrivalAge,
        total = Math.min(
          a.arrivalAge + a.remaining,
          age + 45000 - (((clock % 45000) + 45000) % 45000),
          clip.maxDuration ?? Infinity,
        );
      const interrupted = a.state === "TALKING_TO_PLAYER" || a.nearPlayer;
      if (age >= total && !interrupted) {
        lanterns.release(a.id);
        this.states.set(a.id, state);
        continue;
      }
      const sample = sampleClip(clip, age, total),
        seat = clip.posture === "seated";
      const seatProgress = seat
        ? Math.max(
            0,
            Math.min(1, age / clip.openingMs, (total - age) / clip.closingMs),
          )
        : 0;
      const object =
        clip.id === "delivery"
          ? [2, 3, 4].includes(sample.frame)
            ? "letter"
            : null
          : clip.object;
      const output: ActivitySample = {
        ...state,
        ...sample,
        flip: session.flip,
        age,
        total,
        object,
        seatProgress,
        interrupted,
        reason: session.reason,
      };
      if (interrupted) {
        output.phase = "interrupted";
        output.frame = seat
          ? age < clip.openingMs
            ? clip.opening[0]
            : (clip.interruptedFrame ?? clip.closing[0])
          : null;
        output.object = seat ? "book-closed" : null;
      } else if (
        delta > 0 &&
        clip.commitAt !== undefined &&
        !session.committed &&
        age >= clip.commitAt
      ) {
        session.committed = lanterns.commit(point, a.id);
      }
      this.states.set(a.id, output);
    }
  }
  get(id: string) {
    return this.states.get(id);
  }
  snapshot() {
    return [...this.states.values()].map((s) => ({ ...s }));
  }
}
