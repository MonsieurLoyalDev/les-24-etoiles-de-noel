import type Phaser from "phaser";
import { effectiveQuality, readGraphics } from "../art/graphics";
import {
  decorFor,
  decorLabel,
  DecorationState,
  type DecorativeObject,
  type DecorRoom,
} from "./model";

/** Presentation-only controller. No quest events, RPG save writes or global timers. */
export class InteriorLife {
  readonly state: DecorationState;
  private cat?: Phaser.GameObjects.Image;
  private train?: Phaser.GameObjects.Image;
  private petUntil = 0;
  private trainUntil = 0;
  private flames: {
    image: Phaser.GameObjects.Image;
    item?: DecorativeObject;
  }[] = [];
  private steam: Phaser.GameObjects.Image[] = [];
  private lastAudit = -Infinity;
  private switchGlow?: Phaser.GameObjects.Image;
  constructor(
    private scene: Phaser.Scene,
    readonly room: DecorRoom,
  ) {
    let storage: Storage | undefined;
    try {
      storage = localStorage;
    } catch {
      /* Private browsing may deny storage. */
    }
    this.state = new DecorationState(storage);
    const image = (key: string, x: number, y: number) =>
      scene.add
        .image(x, y, "life-" + key)
        .setOrigin(0.5, 1)
        .setScale(0.5)
        .setDepth(y)
        .setName("decor:" + key);
    image(room + "-console", 60, 320);
    image(room + "-nook", 383, 320);
    if (room === "house") this.cat = image("cat-sleep", 421, 182);
    if (room === "workshop") this.train = image("toy-train", 425, 220);
    const item = decorFor(room).find((x) => x.action === "toggle")!;
    const lamp = room === "library" || room === "workshop";
    const x = room === "library" ? 310 : 300,
      y = room === "library" ? 105 : 130;
    const base = image(lamp ? "lamp-off" : "candle-off", x, y);
    // Flame position is tied to the native sprite's visible wick, not a generic halo.
    const f = image(
      "flame-a",
      x,
      y - base.displayHeight * (lamp ? 0.53 : 0.91),
    );
    f.setDepth(y + 0.1);
    this.flames.push({ image: f, item });
    if (room === "house" || room === "inn") {
      const fire = image(
        "flame-a",
        room === "house" ? 385 : 395,
        room === "house" ? 101 : 106,
      ).setScale(1.1);
      fire.setDepth(120.1);
      this.flames.push({ image: fire });
    }
    for (
      let i = 0;
      i < (room === "workshop" ? 0 : room === "library" ? 2 : 4);
      i++
    ) {
      const s = image(
        "steam",
        room === "library" ? 411 : 226 + (i % 2) * 27,
        room === "library" ? 83 : 112,
      );
      s.setDepth(140).setAlpha(0);
      this.steam.push(s);
    }
  }
  candidates() {
    return decorFor(this.room).map((item) => ({
      id: "decor:" + item.id,
      x: item.x,
      y: item.y,
      name: decorLabel(item, this.state),
    }));
  }
  activate(id: string, time: number) {
    const item = decorFor(this.room).find((x) => x.id === id);
    if (!item) return "";
    if (item.action === "toggle") this.state.toggle(item);
    if (item.action === "pet") this.petUntil = time + 2400;
    if (item.action === "mechanism") this.trainUntil = time + 2200;
    return item.text ?? "";
  }
  update(time: number) {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const quality = effectiveQuality(
        readGraphics(),
        this.scene.scale.width,
        reduced,
      ),
      motion = quality !== "none";
    for (const { image, item } of this.flames) {
      image.setVisible(!item || this.state.isOn(item));
      image.setTexture(
        "life-flame-" + (motion && Math.floor(time / 650) % 2 ? "b" : "a"),
      );
      image.setAlpha(motion ? 0.94 + Math.sin(time / 1700) * 0.035 : 1);
    }
    const switchFlame = this.flames[0];
    if (!this.switchGlow && this.scene.textures.exists("ambient-soft"))
      this.switchGlow = this.scene.add
        .image(switchFlame.image.x, switchFlame.image.y - 3, "ambient-soft")
        .setTint(0xffc179)
        .setDisplaySize(27, 25)
        .setDepth(switchFlame.image.depth + 0.05);
    this.switchGlow
      ?.setVisible(switchFlame.image.visible)
      .setAlpha(motion ? 0.1 + Math.sin(time / 1800) * 0.003 : 0.1);
    this.cat?.setTexture(
      "life-cat-" +
        (motion && (time < this.petUntil || time % 11500 < 500)
          ? "awake"
          : "sleep"),
    );
    this.train?.setX(
      425 +
        (motion && time < this.trainUntil
          ? -6 * Math.sin(((this.trainUntil - time) / 2200) * Math.PI)
          : 0),
    );
    for (const [i, s] of this.steam.entries()) {
      const phase = (time / 4800 + i / 4) % 1;
      const visible =
        motion &&
        i < (quality === "full" ? 4 : 2) &&
        this.scene.cameras.main.worldView.contains(s.x, s.y);
      s.setVisible(visible)
        .setY((this.room === "library" ? 83 : 112) - phase * 12)
        .setAlpha(Math.sin(phase * Math.PI) * 0.22);
    }
    if (time - this.lastAudit > 200) {
      this.lastAudit = time;
      this.scene.game.canvas.dataset.decorative = JSON.stringify({
        room: this.room,
        quality,
        reduced,
        objects: decorFor(this.room).map((x) => ({
          id: x.id,
          action: x.action,
          on: x.action === "toggle" ? this.state.isOn(x) : undefined,
        })),
        flames: this.flames.filter((x) => x.image.visible).length,
        steam: this.steam.filter((x) => x.visible).length,
        cat: this.cat?.texture.key,
        petting: time < this.petUntil,
        mechanism: time < this.trainUntil,
        trainX: this.train?.x,
      });
    }
  }
}
