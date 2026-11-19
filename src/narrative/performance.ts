import { effectiveQuality, readGraphics } from "../art/graphics";
import type Phaser from "phaser";
import type { Point } from "../domain";
import type { PerformanceDefinition } from "./flow";

export function validatePerformance(p: PerformanceDefinition) {
  if (
    !p ||
    !["theatre", "fireflies", "concert"].includes(p.kind) ||
    !Number.isSafeInteger(p.duration) ||
    p.duration < 1000 ||
    p.duration > 120000 ||
    (p.shape !== undefined &&
      !["trail", "flower-tree-star"].includes(p.shape)) ||
    (p.subtitles !== undefined &&
      (!Array.isArray(p.subtitles) ||
        p.subtitles.length > 24 ||
        p.subtitles.some(
          (s) => typeof s !== "string" || !s.length || s.length > 300,
        )))
  )
    throw Error("Spectacle déclaratif invalide");
}

/** A bounded choreography, not a new simulation or reward system. */
export function fireflyPoint(
  index: number,
  count: number,
  phase: number,
  t: number,
): Point {
  const a = (index / count) * Math.PI * 2;
  if (phase === 0) {
    const radius = 48 + 23 * Math.cos(a * 5);
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius * 0.7 };
  }
  if (phase === 1) {
    const height = index / Math.max(1, count - 1);
    return { x: Math.sin(a * 3) * (1 - height) * 65, y: 35 - height * 140 };
  }
  if (phase === 2) {
    const vertex = Math.floor((index / count) * 10),
      fraction = (index / count) * 10 - vertex;
    const point = (v: number) => {
      const angle = (v * Math.PI) / 5 - Math.PI / 2,
        radius = v % 2 ? 29 : 70;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    };
    const from = point(vertex),
      to = point((vertex + 1) % 10);
    return {
      x: from.x + (to.x - from.x) * fraction,
      y: from.y + (to.y - from.y) * fraction,
    };
  }
  return { x: index * 5 - count * 2.5, y: Math.sin(a + t) * 8 };
}

/** Camera-fixed text still inherits Phaser's zoom; compensate around its origin. */
export function subtitlePlacement(width: number, height: number, zoom: number) {
  return {
    x: width / 2,
    y: height / 2 + (height / 2 - 100) / zoom,
    scale: 1 / zoom,
  };
}

export class NarrativePerformance {
  private particles: Phaser.GameObjects.Image[] = [];
  private subtitle?: Phaser.GameObjects.Text;
  private label = "";
  constructor(private scene: Phaser.Scene) {}
  update(
    p: PerformanceDefinition,
    elapsed: number,
    origin: Point,
    reduced: boolean,
    destination?: Point,
  ) {
    const quality = effectiveQuality(
      readGraphics(),
      Math.min(this.scene.scale.width, this.scene.scale.height),
      reduced,
    );
    const still = quality === "none";
    const count = still ? 12 : quality === "soft" ? 20 : 36;
    if (p.kind === "fireflies") {
      this.scene.game.canvas.dataset.performanceParticles = String(count);
      while (this.particles.length < count)
        this.particles.push(
          this.scene.add
            .image(0, 0, "quest_star")
            .setDisplaySize(3, 3)
            .setDepth(5000),
        );
      const normalized = Math.min(0.9999, elapsed / p.duration),
        section = normalized * 3;
      const phase = p.shape === "trail" ? 3 : Math.floor(section);
      this.particles.forEach((image, i) => {
        image.setVisible(i < count);
        const target = fireflyPoint(i, count, phase, elapsed / 1000);
        const previous = fireflyPoint(
          i,
          count,
          Math.max(0, phase - 1),
          elapsed / 1000,
        );
        const blend = still ? 1 : Math.min(1, (section % 1) * 4);
        if (phase === 3 && destination) {
          const progress = still ? 1 : (elapsed / 6000 + i / count) % 1;
          image.setPosition(
            origin.x + (destination.x - origin.x) * progress,
            origin.y -
              20 +
              (destination.y - origin.y) * progress +
              Math.sin(i + (still ? 0 : elapsed / 1200)) * 7,
          );
          image.setAlpha(0.7);
          return;
        }
        image.setPosition(
          origin.x + previous.x + (target.x - previous.x) * blend,
          origin.y - 60 + previous.y + (target.y - previous.y) * blend,
        );
        image.setAlpha(still ? 0.7 : 0.55 + 0.2 * Math.sin(i + elapsed / 900));
      });
    }
    const lines = p.subtitles ?? [];
    const line =
      lines[
        Math.min(
          lines.length - 1,
          Math.floor((elapsed / p.duration) * lines.length),
        )
      ] ?? "";
    if (line !== this.label) {
      this.label = line;
      this.subtitle?.destroy();
      this.subtitle = line
        ? this.scene.add
            .text(0, 0, line, {
              fontFamily: "Nunito",
              fontSize: "16px",
              color: "#fff4d3",
              backgroundColor: "#332c29",
              padding: { x: 12, y: 8 },
              wordWrap: { width: Math.min(600, this.scene.scale.width - 40) },
              align: "center",
            })
            .setOrigin(0.5, 1)
            .setScrollFactor(0)
            .setDepth(10000)
        : undefined;
    }
    const camera = this.scene.cameras.main;
    const position = subtitlePlacement(
      camera.width,
      camera.height,
      camera.zoom,
    );
    this.subtitle?.setPosition(position.x, position.y).setScale(position.scale);
  }
  destroy() {
    delete this.scene.game.canvas.dataset.performanceParticles;
    for (const image of this.particles) image.destroy();
    this.particles = [];
    this.subtitle?.destroy();
    this.subtitle = undefined;
    this.label = "";
  }
}
