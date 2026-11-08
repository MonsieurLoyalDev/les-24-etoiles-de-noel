import type Phaser from "phaser";
import { homes } from "../art/village33";
import {
  atmospherePalette,
  effectiveQuality,
  readGraphics,
} from "../art/graphics";
export class NeighbourhoodLife {
  private smoke: {
    image: Phaser.GameObjects.Image;
    x: number;
    y: number;
    phase: number;
  }[] = [];
  private windows: { image: Phaser.GameObjects.Image; phase: number }[] = [];
  private lastAudit = -Infinity;
  constructor(private scene: Phaser.Scene) {
    for (const [i, h] of homes.entries()) {
      const facade = scene.children.getByName(
        "home:" + h.key,
      ) as Phaser.GameObjects.Image;
      const point = ([u, v]: number[]) => ({
        x: facade.x + (u - 0.5) * facade.displayWidth,
        y: facade.y - (1 - v) * facade.displayHeight,
      });
      const chimney = point(h.chimney);
      for (let j = 0; j < 2; j++)
        this.smoke.push({
          image: scene.add
            .image(chimney.x, chimney.y, "life-steam")
            .setScale(0.65)
            .setDepth(facade.depth + 1)
            .setAlpha(0),
          ...chimney,
          phase: (i * 0.137 + j * 0.5) % 1,
        });
      for (const w of h.windows) {
        const p = point(w);
        this.windows.push({
          image: scene.add
            .image(p.x, p.y, "ambient-soft")
            .setTint(0xffbe70)
            .setDisplaySize(15, 16)
            .setDepth(facade.depth + 0.1),
          phase: i,
        });
      }
    }
  }
  update(time: number, clock: number) {
    const quality = effectiveQuality(
      readGraphics(),
      this.scene.scale.width,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    const budget = quality === "full" ? 8 : quality === "soft" ? 4 : 0,
      view = this.scene.cameras.main.worldView;
    let visible = 0;
    for (const p of this.smoke) {
      const t = (time / 6200 + p.phase) % 1;
      const show = visible < budget && view.contains(p.x, p.y);
      p.image
        .setVisible(show)
        .setPosition(p.x + t * 5, p.y - t * 21)
        .setAlpha(Math.sin(t * Math.PI) * 0.2);
      if (show) visible++;
    }
    const warm = atmospherePalette(clock).warm;
    for (const p of this.windows)
      p.image
        .setVisible(view.contains(p.image.x, p.image.y))
        .setAlpha(
          (0.035 + warm * 0.1) *
            (quality === "none"
              ? 1
              : 1 + Math.sin(time / 2600 + p.phase) * 0.025),
        );
    if (time - this.lastAudit > 500) {
      this.lastAudit = time;
      this.scene.game.canvas.dataset.neighbourhood = JSON.stringify({
        houses: homes.length,
        quality,
        smoke: visible,
        budget,
        lights: this.windows.filter((x) => x.image.visible).length,
      });
    }
  }
}
export function drawHomes(scene: Phaser.Scene) {
  for (const h of homes)
    scene.add
      .image(h.x, h.y, "life-" + h.key)
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(h.y - 5)
      .setName("home:" + h.key);
}
