import { period } from "../rpg/world";
import { worldPoints } from "./points";
export type LanternState = {
  id: string;
  on: boolean;
  level: number;
  owner: string | null;
  target: boolean;
  commits: number;
  tint?: number;
  shimmer?: boolean;
};
/** Single coordinator consumed by the existing ambient lights, never another light renderer. */
export class LanternCoordinator {
  private phase = -1;
  private states = new Map<string, LanternState>();
  private narrative = new Map<
    string,
    { on: boolean; tint: number; shimmer?: boolean }
  >();
  configureNarrative(
    values: Record<string, { on: boolean; tint: number; shimmer?: boolean }>,
  ) {
    this.narrative = new Map(Object.entries(values));
  }
  constructor() {
    for (const p of worldPoints.filter((p) => p.kind === "lantern"))
      this.states.set(p.id, {
        id: p.id,
        on: false,
        level: 0,
        owner: null,
        target: false,
        commits: 0,
      });
  }
  update(clock: number, delta: number) {
    const phase = period(clock);
    if (phase !== this.phase) {
      this.phase = phase;
      for (const s of this.states.values()) {
        s.on = phase === 0 || phase === 3;
        s.level = s.on ? 1 : 0;
        s.target = s.on;
        s.owner = null;
      }
    }
    for (const s of this.states.values()) {
      const override = this.narrative.get(s.id);
      if (override) {
        s.on = override.on;
        s.target = override.on;
        s.owner = null;
        s.tint = override.tint;
        s.shimmer = override.shimmer;
      } else {
        s.tint = undefined;
        s.shimmer = undefined;
      }
      const goal = s.on ? 1 : 0,
        step = Math.max(0, delta) / 800;
      s.level +=
        Math.sign(goal - s.level) * Math.min(Math.abs(goal - s.level), step);
    }
  }
  reserve(id: string, actor: string, on: boolean) {
    const s = this.states.get(id);
    if (
      !s ||
      this.narrative.has(id) ||
      s.on === on ||
      (s.owner && s.owner !== actor)
    )
      return false;
    s.owner = actor;
    s.target = on;
    return true;
  }
  commit(id: string, actor: string) {
    const s = this.states.get(id);
    if (!s || s.owner !== actor || s.on === s.target) return false;
    s.on = s.target;
    s.commits++;
    return true;
  }
  release(actor: string) {
    for (const s of this.states.values()) if (s.owner === actor) s.owner = null;
  }
  get(id: string) {
    return this.states.get(id);
  }
  snapshot() {
    return [...this.states.values()].map((s) => ({ ...s }));
  }
}
