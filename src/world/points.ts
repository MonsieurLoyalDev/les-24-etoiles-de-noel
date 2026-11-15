import type { Point } from "../domain";
import type { Room } from "../rpg/world";
export type WorldState =
  "IDLE" | "WALKING" | "OBSERVING" | "RESTING" | "TALKING_TO_PLAYER";
export type WorldPoint = {
  id: string;
  room: Room;
  position: Point;
  lookAt: Point;
  capacity: number;
  slots?: Point[];
  kind: "lantern" | "mailbox" | "reading" | "rest" | "seat";
  seatedAnimation?: string;
  seatProjection?: {
    offset: Point;
    fixture: { key: string; x: number; y: number };
    foreground: { x: number; y: number; w: number; h: number }[];
  };
};
export const worldPoints: WorldPoint[] = [
  {
    id: "library-armchair",
    room: "library",
    position: { x: 910, y: 316 },
    lookAt: { x: 910, y: 278 },
    capacity: 1,
    kind: "seat",
    seatedAnimation: "seatRead",
    seatProjection: {
      offset: { x: 0, y: -28 },
      fixture: { key: "library-nook", x: 910, y: 310 },
      foreground: [
        { x: 25, y: 80, w: 20, h: 60 },
        { x: 95, y: 80, w: 13, h: 60 },
      ],
    },
  },
  {
    id: "plaza-market-lantern",
    room: "village",
    position: { x: 805, y: 764 },
    lookAt: { x: 784, y: 775 },
    capacity: 1,
    kind: "lantern",
  },
  {
    id: "plaza-gifts-lantern",
    room: "village",
    position: { x: 855, y: 664 },
    lookAt: { x: 875, y: 678 },
    capacity: 1,
    kind: "lantern",
  },
  {
    id: "plaza-evening-lantern",
    room: "village",
    position: { x: 1036, y: 844 },
    lookAt: { x: 1015, y: 858 },
    capacity: 1,
    kind: "lantern",
  },
  {
    id: "plaza-quiet",
    room: "village",
    position: { x: 1100, y: 800 },
    lookAt: { x: 960, y: 790 },
    capacity: 1,
    kind: "rest",
  },
  {
    id: "mail-books",
    room: "village",
    position: { x: 173, y: 446 },
    lookAt: { x: 193, y: 427 },
    capacity: 1,
    kind: "mailbox",
  },
  {
    id: "mail-families",
    room: "village",
    position: { x: 1315, y: 588 },
    lookAt: { x: 1335, y: 569 },
    capacity: 1,
    kind: "mailbox",
  },
  {
    id: "post-start",
    room: "village",
    position: { x: 750, y: 700 },
    lookAt: { x: 780, y: 650 },
    capacity: 1,
    kind: "rest",
  },
  {
    id: "library-welcome",
    room: "library",
    position: { x: 120, y: 230 },
    lookAt: { x: 240, y: 138 },
    capacity: 1,
    kind: "reading",
  },
  {
    id: "library-shelves",
    room: "library",
    position: { x: 590, y: 180 },
    lookAt: { x: 590, y: 150 },
    capacity: 1,
    kind: "reading",
  },
  {
    id: "library-reading",
    room: "library",
    position: { x: 740, y: 324 },
    lookAt: { x: 740, y: 280 },
    capacity: 1,
    kind: "reading",
  },
];
/** Generic capacity ownership. A seat without a validated animation is unavailable for sitting. */
export class PointReservations {
  private owners = new Map<string, Map<string, number>>();
  reserve(point: WorldPoint, actor: string, sitting = false) {
    if (sitting && !point.seatedAnimation) return false;
    const owners = this.owners.get(point.id) ?? new Map<string, number>();
    if (owners.has(actor)) return true;
    const capacity = Math.min(
      point.capacity,
      point.slots?.length ?? point.capacity,
    );
    if (owners.size >= capacity) return false;
    let slot = 0;
    while ([...owners.values()].includes(slot)) slot++;
    owners.set(actor, slot);
    this.owners.set(point.id, owners);
    return true;
  }
  release(actor: string) {
    for (const [id, owners] of this.owners) {
      owners.delete(actor);
      if (!owners.size) this.owners.delete(id);
    }
  }
  count(id: string) {
    return this.owners.get(id)?.size ?? 0;
  }
  position(point: WorldPoint, actor: string) {
    const slot = this.owners.get(point.id)?.get(actor);
    return slot === undefined
      ? null
      : { ...(point.slots?.[slot] ?? point.position) };
  }
  snapshot() {
    return [...this.owners].map(([id, owners]) => ({
      id,
      owners: [...owners].map(([actor, slot]) => ({ actor, slot })),
    }));
  }
}
