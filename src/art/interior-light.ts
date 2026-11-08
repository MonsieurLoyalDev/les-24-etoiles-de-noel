import type Phaser from "phaser";
import type { InteriorRoom } from "./interiors";
import { furnitureByRoom } from "./interior-layout";
import { lanterns33 } from "./rooms33";
import { atmospherePalette, effectiveQuality, readGraphics } from "./graphics";
function mix(a: number, b: number, t: number) {
  const channel = (shift: number) =>
    Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}
export function interiorLightPalette(clock: number) {
  const exterior = atmospherePalette(clock);
  const ambient = mix(0xf2eee5, exterior.color, (exterior.alpha / 0.27) * 0.23);
  return {
    ambient,
    furniture: mix(0xfff5e7, ambient, 0.45),
    warm: 0.24 + 0.76 * exterior.warm,
  };
}
type Source = { name: string; u: number; v: number; size: number };
const sources: Record<InteriorRoom, Source[]> = {
  house: [
    { name: "house-table", u: 0.5, v: 0.22, size: 12 },
    { name: "house-hearth", u: 0.55, v: 0.8, size: 23 },
  ],
  library: [
    { name: "library-shelves", u: 0.56, v: 0.4, size: 12 },
    { name: "library-desk", u: 0.8, v: 0.18, size: 12 },
    { name: "library-nook", u: 0.25, v: 0.15, size: 13 },
  ],
  workshop: [],
  inn: [
    { name: "inn-table", u: 0.63, v: 0.16, size: 12 },
    { name: "inn-hearth", u: 0.58, v: 0.78, size: 23 },
    { name: "inn-hearth", u: 0.36, v: 0.33, size: 8 },
  ],
};
/** No physics, events or timers. Existing art is tinted and actual lamps receive small local light layers. */
export class InteriorLight {
  private lights: {
    image: Phaser.GameObjects.Image;
    x: number;
    y: number;
    size: number;
  }[] = [];
  private furniture: Phaser.GameObjects.Image[] = [];
  private architecture: Phaser.GameObjects.Image;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  private samples: number[] = [];
  private lastAudit = 0;
  constructor(
    private scene: Phaser.Scene,
    room: InteriorRoom,
  ) {
    this.architecture = scene.children.getByName(
      "interior:architecture:" + room,
    ) as Phaser.GameObjects.Image;
    this.furniture = furnitureByRoom[room].map(
      (name) =>
        scene.children.getByName(
          "interior:" + name,
        ) as Phaser.GameObjects.Image,
    );
    this.furniture.push(
      ...(scene.children.list.filter(
        (x) =>
          x.name.startsWith("interior:annex:") || x.name === "interior:window",
      ) as Phaser.GameObjects.Image[]),
    );
    const add = (x: number, y: number, size: number, depth: number) => {
      const image = scene.add
        .image(x, y, "ambient-soft")
        .setTint(0xffc276)
        .setDisplaySize(size, size * 0.82)
        .setBlendMode(1)
        .setDepth(depth);
      this.lights.push({ image, x, y, size });
    };
    for (const p of lanterns33(room)) add(p.x, p.y + 4, 15, p.y + 0.1);
    for (const p of sources[room]) {
      const image = scene.children.getByName(
        "interior:" + p.name,
      ) as Phaser.GameObjects.Image;
      add(
        image.x + (p.u - 0.5) * image.displayWidth,
        image.y - (1 - p.v) * image.displayHeight,
        p.size,
        image.depth + 0.1,
      );
    }
  }
  update(time: number, clock: number) {
    if (document.hidden) return;
    const start = performance.now(),
      palette = interiorLightPalette(clock);
    const quality = effectiveQuality(
      readGraphics(),
      Math.min(this.scene.scale.width, this.scene.scale.height),
      this.reduced.matches,
    );
    const motion = quality !== "none",
      view = this.scene.cameras.main.worldView;
    this.architecture.setTint(palette.ambient);
    this.furniture.forEach((image) => image.setTint(palette.furniture));
    let visible = 0;
    for (const [i, l] of this.lights.entries()) {
      const onscreen =
        l.x + l.size > view.x &&
        l.x - l.size < view.right &&
        l.y + l.size > view.y &&
        l.y - l.size < view.bottom;
      l.image.setVisible(onscreen);
      if (onscreen) {
        l.image.setAlpha(
          0.26 *
            palette.warm *
            (motion ? 1 + Math.sin(time / 1900 + i * 1.7) * 0.025 : 1),
        );
        visible++;
      }
    }
    this.samples.push(performance.now() - start);
    if (this.samples.length > 180) this.samples.shift();
    if (time - this.lastAudit > 500) {
      this.lastAudit = time;
      const sorted = [...this.samples].sort((a, b) => a - b);
      this.scene.game.canvas.dataset.interiorLight = JSON.stringify({
        quality,
        motion,
        visibleLights: visible,
        lightPool: this.lights.length,
        cpuP95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        palette,
      });
    }
  }
}
