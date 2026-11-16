import Phaser from "phaser";
import assets from "./polish-assets.json";
import { animateActor } from "../art/actors";
import type { Point } from "../domain";

export const gestureFrames = {
  hands: [0, 1, 2, 3, 3, 2, 1, 0],
  hug: [4, 5, 6, 7, 7, 6, 5, 4],
  sit: [0, 1, 2, 3, 3, 2, 1, 0],
  glasses: [4, 5, 6, 7, 7, 6, 5, 4],
} as const;
export type Gesture = keyof typeof gestureFrames;
export function preloadNarrativePolish(scene: Phaser.Scene) {
  for (const [name, data] of Object.entries(assets))
    scene.load.spritesheet(`e21-${name}`, data.file, data);
}
/** Cosmetic drawn frames only. No actor body, save, route or quest mutations. */
export class DayOnePolish {
  private pair?: {
    sprite: Phaser.GameObjects.Sprite;
    actors: Phaser.GameObjects.Sprite[];
    positions: Point[];
    kind: Gesture;
    elapsed: number;
  };
  private foxIdle = 0;
  private foxPosition: Point | null = null;
  private foxOverride?: Phaser.GameObjects.Sprite;
  constructor(private scene: Phaser.Scene) {}
  get active() {
    return !!this.pair;
  }
  get gesture() {
    return this.pair?.kind ?? null;
  }
  get bounds() {
    if (!this.pair) return null;
    const b = this.pair.sprite.getBounds(),
      camera = this.scene.cameras.main,
      v = camera.worldView;
    return {
      x: (b.left - v.x) * camera.zoom - 25,
      y: (b.top - v.y) * camera.zoom - 25,
      width: b.width * camera.zoom + 50,
      height: b.height * camera.zoom + 50,
    };
  }
  start(
    kind: Gesture,
    debby: Phaser.GameObjects.Sprite,
    loyal: Phaser.GameObjects.Sprite,
    bench?: Phaser.GameObjects.Image,
  ) {
    this.clear();
    if (
      Math.hypot(debby.x - loyal.x, debby.y - loyal.y) > 65 ||
      !this.scene.textures.exists("e21-human")
    )
      return;
    const sheet = kind === "sit" || kind === "glasses" ? "seats" : "human";
    if (
      kind === "sit" &&
      (!bench?.active || Math.hypot(debby.x - bench.x, debby.y - bench.y) > 70)
    )
      return;
    const group =
      assets[sheet].groups[kind === "hands" || kind === "sit" ? 0 : 1];
    const bounds = bench?.getBounds();
    const sprite = this.scene.add
      .sprite(
        Math.round(kind === "sit" && bench ? bench.x : (debby.x + loyal.x) / 2),
        Math.round(
          kind === "sit" && bounds
            ? bounds.top + bounds.height * 0.55 + 14
            : Math.max(debby.y, loyal.y),
        ),
        `e21-${sheet}`,
        gestureFrames[kind][0],
      )
      .setOrigin(0.5, group.foot)
      .setScale((kind === "sit" ? 42 : 52) / group.height)
      .setDepth(
        kind === "sit" && bench
          ? bench.depth + 1
          : Math.max(debby.y, loyal.y) + 1,
      )
      .setName("narrative:human-gesture");
    this.pair = {
      sprite,
      actors: [debby, loyal],
      positions: [
        { x: debby.x, y: debby.y },
        { x: loyal.x, y: loyal.y },
      ],
      kind,
      elapsed: 0,
    };
    debby.setVisible(false);
    loyal.setVisible(false);
  }
  update(delta: number, blocked: boolean, reduced: boolean) {
    const p = this.pair;
    if (!p) return;
    if (
      blocked ||
      p.actors.some(
        (a, i) =>
          !a.active ||
          Math.hypot(a.x - p.positions[i].x, a.y - p.positions[i].y) > 3,
      )
    ) {
      this.clear();
      return;
    }
    p.elapsed += Math.min(100, delta);
    const duration = reduced ? 500 : 3200;
    if (p.elapsed >= duration) {
      this.clear();
      return;
    }
    p.sprite.setFrame(
      gestureFrames[p.kind][
        reduced ? 3 : Math.min(7, Math.floor((p.elapsed / duration) * 8))
      ],
    );
  }
  fox(
    sprite: Phaser.GameObjects.Sprite,
    delta: number,
    mode: "quiet" | "home" | "discovery" | "blocked",
    reduced: boolean,
  ) {
    const moved =
      !this.foxPosition ||
      Math.hypot(sprite.x - this.foxPosition.x, sprite.y - this.foxPosition.y) >
        0.15;
    this.foxPosition = { x: sprite.x, y: sprite.y };
    if (moved || mode === "blocked") {
      this.foxIdle = 0;
      if (this.foxOverride) {
        animateActor(sprite);
        this.foxOverride = undefined;
      }
      return;
    }
    this.foxIdle += Math.min(delta, 100);
    if (this.foxIdle < 1800 || !this.scene.textures.exists("e21-fox")) return;
    const sleeping = mode === "home";
    const frame = sleeping
      ? reduced
        ? 0
        : Math.floor(this.foxIdle / 850) % 4
      : mode === "discovery"
        ? 6
        : reduced
          ? 4
          : ([4, 4, 4, 5, 4, 7] as const)[Math.floor(this.foxIdle / 700) % 6];
    sprite
      .stop()
      .setTexture("e21-fox", frame)
      .setFlipX(false)
      .setOrigin(0.5, assets.fox.groups[1].foot)
      .setScale(31 / assets.fox.groups[1].height);
    this.foxOverride = sprite;
  }
  resetFox() {
    if (this.foxOverride?.active) animateActor(this.foxOverride);
    this.foxOverride = undefined;
    this.foxIdle = 0;
  }
  clear() {
    if (this.pair) {
      this.pair.sprite.destroy();
      for (const a of this.pair.actors) if (a.active) a.setVisible(true);
    }
    this.pair = undefined;
  }
  destroy() {
    this.clear();
    this.resetFox();
  }
}
