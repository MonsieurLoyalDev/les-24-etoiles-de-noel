import { ActivityDirector } from "./activities";
import { LanternCoordinator } from "./lanterns";
import type { Point, Rect } from "../domain";
import { period, type Room } from "../rpg/world";
import { NavigationGrid, type RouteSegment } from "./navigation";
import {
  worldPoints,
  PointReservations,
  type WorldPoint,
  type WorldState,
} from "./points";
import { worldProfiles, type WorldProfile, type Activity } from "./registry";
export type LivingActor = {
  id: string;
  profile: WorldProfile;
  position: Point;
  state: WorldState;
  phase: number;
  taskIndex: number;
  intent: Activity | null;
  path: Point[];
  pathIndex: number;
  remaining: number;
  arrivalAge: number;
  queued: boolean;
  retryIn: number;
  stuck: number;
  lastPosition: Point;
  nearPlayer: boolean;
  accumulator: number;
  previousState: WorldState | null;
  visits: number;
  blockedReason: string;
  reaction: {
    clip: string;
    age: number;
    duration: number;
    flip: boolean;
  } | null;
  reactionCooldown: number;
};
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export class LivingWorld {
  readonly activities = new ActivityDirector();
  readonly lanterns = new LanternCoordinator();
  get clock() {
    return this.lastClock;
  }
  readonly actors = new Map<string, LivingActor>();
  readonly reservations = new PointReservations();
  readonly environments = new Map<Room, NavigationGrid>();
  private routeBudget = 0;
  private pointStatus = new Map<string, boolean>();
  private cursor = 0;
  private lastClock = 0;
  constructor() {
    for (const profile of worldProfiles)
      this.actors.set(profile.id, {
        id: profile.id,
        profile,
        position: { ...profile.spawn },
        state: "IDLE",
        phase: -1,
        taskIndex: 0,
        intent: null,
        path: [],
        pathIndex: 0,
        remaining: 0,
        arrivalAge: 0,
        queued: true,
        retryIn: 0,
        stuck: 0,
        lastPosition: { ...profile.spawn },
        nearPlayer: false,
        accumulator: 0,
        previousState: null,
        visits: 0,
        blockedReason: "",
        reaction: null,
        reactionCooldown: 0,
      });
  }
  attach(
    room: Room,
    width: number,
    height: number,
    rects: Rect[],
    routes: RouteSegment[] = [],
    courts: number[][][] = [],
  ) {
    if (this.environments.has(room)) return;
    const nav = new NavigationGrid(width, height, rects, routes, courts);
    this.environments.set(room, nav);
    for (const point of worldPoints.filter((p) => p.room === room))
      this.pointStatus.set(point.id, nav.isFree(point.position));
    const occupied: Point[] = [];
    for (const a of this.actors.values())
      if (a.profile.room === room) {
        const safe = nav.nearestFree(a.position, occupied);
        if (safe) a.position = safe;
        a.lastPosition = { ...a.position };
        occupied.push(a.position);
      }
  }
  has(id: string) {
    return this.actors.has(id);
  }
  get(id: string) {
    return this.actors.get(id);
  }
  point(a: LivingActor): WorldPoint | undefined {
    return worldPoints.find((p) => p.id === a.intent?.point);
  }
  private choose(a: LivingActor, phase: number) {
    this.reservations.release(a.id);
    a.phase = phase;
    a.taskIndex = 0;
    a.intent = a.profile.schedule[phase][0];
    a.path = [];
    a.pathIndex = 0;
    a.queued = true;
    a.state = "IDLE";
    a.retryIn = 0;
    a.remaining = 0;
    a.blockedReason = "";
  }
  private next(a: LivingActor) {
    this.reservations.release(a.id);
    a.taskIndex = (a.taskIndex + 1) % a.profile.schedule[a.phase].length;
    a.intent = a.profile.schedule[a.phase][a.taskIndex];
    a.path = [];
    a.pathIndex = 0;
    a.queued = true;
    a.state = "IDLE";
    a.retryIn = 0;
  }
  private route(a: LivingActor, avoid: Point[] = []) {
    const nav = this.environments.get(a.profile.room),
      point = this.point(a);
    if (!nav || !point || !this.pointStatus.get(point.id)) {
      a.blockedReason = "point unavailable";
      a.retryIn = 4000;
      return;
    }
    if (!this.reservations.reserve(point, a.id)) {
      a.blockedReason = "point reserved";
      a.retryIn = 1500;
      return;
    }
    const goal = this.reservations.position(point, a.id)!;
    const route = nav.findPath(a.position, goal, avoid);
    a.queued = false;
    if (!route) {
      this.reservations.release(a.id);
      a.state = "IDLE";
      a.blockedReason = "no safe route";
      a.retryIn = 3000;
      return;
    }
    a.path = route;
    a.pathIndex = 0;
    a.state = "WALKING";
    a.stuck = 0;
    a.blockedReason = "";
  }
  update(
    clock: number,
    delta: number,
    room: Room,
    player: Point,
    talking: string | null,
    visible: (p: Point) => boolean,
    reserved: ReadonlySet<string> = new Set(),
  ) {
    this.lastClock = clock;
    delta = Math.max(0, Math.min(delta, 200));
    this.lanterns.update(clock, delta);
    const phase = period(clock),
      all = [...this.actors.values()];
    for (const a of all) {
      if (a.id === talking || reserved.has(a.id)) {
        a.reaction = null;
        if (a.state !== "TALKING_TO_PLAYER") {
          a.previousState = a.state;
          a.state = "TALKING_TO_PLAYER";
        }
        continue;
      }
      if (a.state === "TALKING_TO_PLAYER") {
        a.state = a.previousState ?? "IDLE";
        a.previousState = null;
      }
      if (delta === 0) continue;
      if (a.phase !== phase) this.choose(a, phase);
      const nav = this.environments.get(a.profile.room);
      if (!nav) continue;
      const active = a.profile.room === room && visible(a.position);
      const close =
        a.profile.room === room &&
        dist(a.position, player) < (a.nearPlayer ? 52 : 43) &&
        nav.clear(a.position, player);
      a.nearPlayer = close;
      if (close) {
        a.reaction = null;
        a.accumulator = 0;
        continue;
      }
      a.reactionCooldown = Math.max(0, a.reactionCooldown - delta);
      if (a.reaction) {
        a.reaction.age += delta;
        a.accumulator = 0;
        if (a.reaction.age >= a.reaction.duration) a.reaction = null;
        else continue;
      }
      if (
        a.profile.greetingClip &&
        active &&
        a.state === "WALKING" &&
        a.reactionCooldown === 0
      ) {
        const peer = all.find(
          (b) =>
            b.id !== a.id &&
            b.profile.room === a.profile.room &&
            b.id !== talking &&
            !reserved.has(b.id) &&
            b.state !== "TALKING_TO_PLAYER" &&
            visible(b.position) &&
            dist(a.position, b.position) < 45 &&
            nav.clear(a.position, b.position),
        );
        if (peer) {
          a.reaction = {
            clip: a.profile.greetingClip,
            age: 0,
            duration: 1300,
            flip: peer.position.x < a.position.x,
          };
          a.reactionCooldown = 45000;
          a.accumulator = 0;
          continue;
        }
      }
      a.retryIn = Math.max(0, a.retryIn - delta);
      a.accumulator += delta;
      if (a.state === "WALKING" && !active && a.accumulator < 250) continue;
      const elapsed = a.state === "WALKING" ? a.accumulator : delta;
      a.accumulator = 0;
      if (a.state === "WALKING") {
        let budget = (a.profile.speed * elapsed) / 1000;
        while (a.pathIndex < a.path.length && budget > 0) {
          const goal = a.path[a.pathIndex],
            d = dist(goal, a.position);
          if (d < 0.01) {
            a.pathIndex++;
            continue;
          }
          const amount = Math.min(d, budget),
            proposal = nav.advance(
              a.position,
              ((goal.x - a.position.x) * amount) / d,
              ((goal.y - a.position.y) * amount) / d,
            );
          const other = all.find(
            (b) =>
              b.id !== a.id &&
              b.profile.room === a.profile.room &&
              dist(proposal, b.position) < 18,
          );
          if (other) {
            a.stuck += elapsed;
            a.blockedReason = "yields to " + other.id;
            if (a.stuck > 1500 && a.id > other.id) {
              a.queued = true;
              a.retryIn = 0;
              a.path = [];
              a.state = "IDLE";
            }
            break;
          }
          const travelled = dist(proposal, a.position);
          a.position = proposal;
          budget -= amount;
          if (travelled < 0.05) {
            a.stuck += elapsed;
            break;
          }
          a.stuck = 0;
          if (dist(goal, a.position) < 0.01) a.pathIndex++;
        }
        if (a.pathIndex >= a.path.length && a.state === "WALKING") {
          a.state = a.intent?.state ?? "IDLE";
          a.remaining =
            (a.intent?.dwell ?? 7000) +
            ((a.id.length * 97 + a.visits * 131) % 900) -
            (budget * 1000) / a.profile.speed;
          a.arrivalAge = (budget * 1000) / a.profile.speed;
          a.visits++;
        }
        if (a.stuck > 1500) {
          a.path = [];
          a.state = "IDLE";
          a.queued = true;
          a.retryIn = Math.max(a.retryIn, 1200);
          a.stuck = 0;
        }
      } else if (a.state === "OBSERVING" || a.state === "RESTING") {
        a.remaining -= elapsed;
        a.arrivalAge += elapsed;
        if (a.remaining <= 0) this.next(a);
      } else if (!a.queued && a.retryIn === 0) {
        a.queued = true;
      }
    }
    this.routeBudget += delta;
    if (delta > 0 && this.routeBudget >= 250) {
      this.routeBudget = 0;
      for (let i = 0; i < all.length; i++) {
        const index = (this.cursor + i) % all.length,
          a = all[index];
        if (
          a.queued &&
          !a.retryIn &&
          !a.nearPlayer &&
          a.state !== "TALKING_TO_PLAYER" &&
          this.environments.has(a.profile.room)
        ) {
          const avoid = all
            .filter(
              (b) =>
                b.id !== a.id &&
                b.profile.room === a.profile.room &&
                dist(b.position, a.position) < 45,
            )
            .map((b) => b.position);
          this.route(a, avoid);
          this.cursor = (index + 1) % all.length;
          break;
        }
      }
    }
    this.activities.update(this.actors.values(), clock, delta, this.lanterns);
  }
  snapshot() {
    return {
      clock: this.lastClock,
      prototypeIds: worldProfiles.map((p) => p.id),
      actors: [...this.actors.values()].map((a) => ({
        id: a.id,
        name: a.profile.name,
        room: a.profile.room,
        x: a.position.x,
        y: a.position.y,
        state: a.state,
        period: a.phase,
        activity: a.intent?.label ?? "",
        point: a.intent?.point ?? null,
        nearPlayer: a.nearPlayer,
        visits: a.visits,
        pathRemaining: Math.max(0, a.path.length - a.pathIndex),
        blockedReason: a.blockedReason,
        arrivalAge: a.arrivalAge,
      })),
      reservations: this.reservations.snapshot(),
      points: worldPoints.map((p) => ({
        id: p.id,
        room: p.room,
        valid: this.pointStatus.get(p.id) ?? null,
      })),
      navigation: [...this.environments].map(([room, n]) => ({
        room,
        ...n.diagnostics(),
      })),
    };
  }
}
