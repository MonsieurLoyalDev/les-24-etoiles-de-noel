import type { LanternCoordinator } from "../world/lanterns";
import { worldPoints } from "../world/points";
import Phaser from "phaser";
import { villageMap as map, anchors } from "./village34";
import {
  readGraphics,
  effectiveQuality,
  effectBudgets,
  atmospherePalette,
  decorInView,
} from "./graphics";
type Light = {
  image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  base: number;
  size: number;
  point?: string;
  fixture?: Phaser.GameObjects.Image;
};
type Smoke = {
  image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  phase: number;
};
const facades = {
  loyal_house: {
    chimney: [0.24, 0.15],
    windows: [
      [0.46, 0.28],
      [0.68, 0.27],
      [0.175, 0.61],
    ],
  },
  library: {
    chimney: [0.212, 0.09],
    windows: [
      [0.12, 0.57],
      [0.8, 0.55],
    ],
  },
  workshop: {
    chimney: [0.19, 0.15],
    windows: [
      [0.28, 0.66],
      [0.33, 0.34],
      [0.49, 0.105],
      [0.7, 0.35],
    ],
  },
  inn: {
    chimney: [0.22, 0.13],
    windows: [
      [0.47, 0.44],
      [0.74, 0.44],
      [0.6, 0.13],
      [0.8, 0.18],
    ],
  },
};
export class VillageAmbience {
  private lights: Light[] = [];
  private smoke: Smoke[] = [];
  private flakes: Phaser.GameObjects.Image[] = [];
  private wind: Phaser.GameObjects.Image[] = [];
  private stars: Phaser.GameObjects.Image[] = [];
  private sway: Phaser.GameObjects.Image[] = [];
  private garlands: Phaser.GameObjects.Image[] = [];
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  private costs: number[] = [];
  private frames: number[] = [];
  private lastAudit = 0;
  private epoch: number | undefined;
  constructor(
    private scene: Phaser.Scene,
    private shade: Phaser.GameObjects.Rectangle,
    private village: boolean,
    private lanterns?: LanternCoordinator,
  ) {
    if (!scene.textures.exists("ambient-soft")) {
      const tex = scene.textures.createCanvas("ambient-soft", 48, 48)!;
      const g = tex.context.createRadialGradient(24, 24, 0, 24, 24, 24);
      g.addColorStop(0, "rgba(255,255,255,.65)");
      g.addColorStop(0.3, "rgba(255,255,255,.35)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      tex.context.fillStyle = g;
      tex.context.fillRect(0, 0, 48, 48);
      tex.refresh();
    }
    if (!village) {
      scene.game.canvas.dataset.ambience = JSON.stringify({
        quality: "none",
        visibleSnow: 0,
        visibleSmoke: 0,
        visibleWind: 0,
        visibleStars: 0,
        visibleLights: 0,
        swaying: 0,
        particleLimit: 0,
      });
      return;
    }
    const light = (
      x: number,
      y: number,
      size: number,
      base: number,
      depth: number,
      fixture?: Phaser.GameObjects.Image,
    ) => {
      const image = scene.add
        .image(x, y, "ambient-soft")
        .setTint(0xffc178)
        .setDisplaySize(size, size)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(depth);
      const point = fixture
        ? worldPoints.find(
            (p) =>
              p.kind === "lantern" &&
              Math.hypot(p.lookAt.x - fixture.x, p.lookAt.y - fixture.y) < 1,
          )?.id
        : undefined;
      this.lights.push({ image, x, y, size, base, fixture, point });
    };
    for (const p of map.props.filter((p) => p.sprite === "lantern"))
      light(p.tileX * 16, p.tileY * 16 - 49, 23, 0.55, p.tileY * 16 + 1);
    for (const child of scene.children.list)
      if (
        child instanceof Phaser.GameObjects.Image &&
        child.name.startsWith("scenery:") &&
        (child.name.includes("lampadaire") ||
          child.name.includes("prop-lantern"))
      )
        light(
          child.x,
          child.y - child.displayHeight * 0.82,
          23,
          0.45,
          child.depth + 1,
          child,
        );
    light(anchors.tree.x, anchors.tree.y + 4, 176, 0.25, anchors.tree.y - 12);
    this.lights[this.lights.length - 1].image.setDisplaySize(176, 92);
    for (const b of map.buildings) {
      const image = scene.children.getByName(
        "facade:" + b.id,
      ) as Phaser.GameObjects.Image;
      const conf = facades[b.id as keyof typeof facades];
      if (!image || !conf) continue;
      const point = ([u, v]: number[]) => ({
        x: image.x + (u - 0.5) * image.displayWidth,
        y: image.y - (1 - v) * image.displayHeight,
      });
      const chimney = point(conf.chimney);
      for (let i = 0; i < 4; i++)
        this.smoke.push({
          image: scene.add
            .image(chimney.x, chimney.y, "ambient-soft")
            .setTint(0xc6cedc)
            .setDepth(image.depth + 2),
          ...chimney,
          phase: i / 4,
        });
      for (const w of conf.windows) {
        const p = point(w);
        light(p.x, p.y, 22, 0.22, image.depth + 1);
      }
    }
    this.flakes = Array.from({ length: 40 }, () =>
      scene.add.image(0, 0, "ambient-soft").setScrollFactor(0).setDepth(9010),
    );
    this.wind = Array.from({ length: 6 }, () =>
      scene.add.image(0, 0, "ambient-soft").setDepth(8000).setTint(0xe3ebfa),
    );
    this.stars = [
      [70, 170],
      [961, 152],
      [90, 640],
      [927, 702],
      [655, 110],
      [982, 350],
      [160, 710],
      [627, 672],
      [372, 279],
      [906, 450],
    ].map(([x, y]) =>
      scene.add
        .image(x, y, "ambient-soft")
        .setDisplaySize(2.5, 2.5)
        .setDepth(8000)
        .setTint(0xcddfff),
    );
    this.sway = scene.children.list.filter(
      (o) =>
        o instanceof Phaser.GameObjects.Image &&
        o.name.startsWith("scenery:") &&
        /pine|guirlande_lanternes/.test(o.name),
    ) as Phaser.GameObjects.Image[];
    this.garlands = scene.children.list.filter(
      (o) =>
        o instanceof Phaser.GameObjects.Image &&
        o.name.includes("guirlande_lanternes"),
    ) as Phaser.GameObjects.Image[];
  }
  activityLights() {
    return this.lights
      .filter((l) => l.point)
      .map((l) => ({
        id: l.point,
        alpha: l.image.alpha,
        tint: l.fixture?.tintTopLeft,
        texture: l.fixture?.texture.key,
      }));
  }
  update(time: number, clock: number, delta: number) {
    this.epoch ??= time;
    time -= this.epoch;
    const start = performance.now(),
      cam = this.scene.cameras.main;
    const quality = effectiveQuality(
        readGraphics(),
        Math.min(this.scene.scale.width, this.scene.scale.height),
        this.reduced.matches,
      ),
      budget = effectBudgets[quality];
    const palette = atmospherePalette(clock),
      sx = (cam.width - cam.width / cam.zoom) / 2,
      sy = (cam.height - cam.height / cam.zoom) / 2;
    this.shade
      .setPosition(sx, sy)
      .setSize(cam.width / cam.zoom, cam.height / cam.zoom)
      .setFillStyle(palette.color)
      .setAlpha(this.village ? palette.alpha : 0.03);
    if (!this.village || document.hidden) return;
    const view = cam.worldView,
      onscreen = (x: number, y: number, pad = 45) =>
        x > view.x - pad &&
        x < view.right + pad &&
        y > view.y - pad &&
        y < view.bottom + pad;
    const motion = quality !== "none",
      flurry = Math.max(0, Math.sin(time / 7000));
    let visibleLights = 0,
      visibleSmoke = 0,
      visibleSnow = 0,
      visibleWind = 0,
      visibleStars = 0,
      swaying = 0;
    this.lights.forEach((l, i) => {
      const visible = onscreen(l.x, l.y, l.size);
      l.image.setVisible(visible);
      if (visible) {
        const controlled = l.point ? this.lanterns?.get(l.point) : undefined;
        l.image.setTint(controlled?.tint ?? 0xffc178);
        const level = controlled
          ? motion
            ? controlled.level
            : controlled.on
              ? 1
              : 0
          : 1;
        if (controlled && l.fixture) {
          const r = Math.round(101 + 154 * level),
            g = Math.round(117 + 138 * level),
            b = Math.round(135 + 120 * level);
          l.fixture.setTint((r << 16) | (g << 8) | b);
        }
        l.image.setAlpha(
          level *
            l.base *
            (0.12 + palette.warm * 0.88) *
            (motion
              ? 1 +
                Math.sin(time / 1900 + i * 1.7) *
                  (controlled?.shimmer ? 0.06 : 0.035)
              : 1),
        );
        visibleLights++;
      }
    });
    this.smoke.forEach((p, i) => {
      const enabled =
        motion && (quality === "full" || i % 4 < 2) && onscreen(p.x, p.y, 30);
      p.image.setVisible(enabled);
      if (!enabled) return;
      const life = (time / 6500 + p.phase) % 1;
      p.image
        .setPosition(
          p.x + Math.sin(life * 2.1 + i) * 3 + life * 4,
          p.y - life * 21,
        )
        .setDisplaySize(6 + life * 11, 5 + life * 13)
        .setAlpha(Math.sin(life * Math.PI) * 0.22);
      visibleSmoke++;
    });
    this.flakes.forEach((f, i) => {
      const visible = i < budget.snow && flurry > 0.04;
      f.setVisible(visible);
      if (!visible) return;
      const span = cam.width / cam.zoom,
        h = cam.height / cam.zoom;
      f.setPosition(
        sx +
          ((((i * 97 +
            time * (0.002 + (i % 3) * 0.0004) +
            Math.sin(time / 3300 + i) * 4) %
            span) +
            span) %
            span),
        sy + ((i * 137 + time * (0.009 + (i % 5) * 0.001)) % h),
      );
      f.setDisplaySize(1 + (i % 3) * 0.35, 1 + (i % 3) * 0.35).setAlpha(
        (0.44 + (i % 4) * 0.09) * flurry,
      );
      visibleSnow++;
    });
    this.wind.forEach((f, i) => {
      const points = [
          [144, 592],
          [880, 192],
          [224, 640],
          [896, 544],
          [655, 365],
          [356, 372],
        ],
        p = points[i],
        life = (time / 5500 + i * 0.19) % 1;
      const visible =
        i < budget.wind && flurry > 0.2 && onscreen(p[0], p[1], 15);
      f.setVisible(visible);
      if (!visible) return;
      f.setPosition(
        p[0] + life * 15 - 5,
        p[1] - 3 - Math.sin(life * Math.PI) * 4,
      )
        .setDisplaySize(2 + life * 2, 0.8)
        .setAlpha(Math.sin(life * Math.PI) * 0.32);
      visibleWind++;
    });
    this.stars.forEach((s, i) => {
      const visible =
        visibleStars < budget.stars &&
        palette.warm > 0.88 &&
        onscreen(s.x, s.y, 3);
      s.setVisible(visible);
      if (visible) {
        s.setAlpha(0.18 + Math.sin(time / 2500 + i) * 0.12);
        visibleStars++;
      }
    });
    for (const image of this.sway) {
      if (
        motion &&
        swaying < budget.sway &&
        decorInView(
          {
            x: image.x,
            y: image.y,
            width: image.displayWidth,
            height: image.displayHeight,
          },
          view,
        )
      ) {
        image.setAngle(Math.sin(time / 4900 + image.x) * 0.15);
        swaying++;
      } else if (image.angle !== 0) image.setAngle(0);
    }
    for (const image of this.garlands)
      image.setAlpha(
        motion ? 0.99 + Math.sin(time / 2800 + image.x) * 0.01 : 1,
      );
    this.costs.push(performance.now() - start);
    this.frames.push(delta);
    if (this.costs.length > 180) {
      this.costs.shift();
      this.frames.shift();
    }
    if (time - this.lastAudit > 500) {
      this.lastAudit = time;
      const sorted = [...this.costs].sort((a, b) => a - b);
      this.scene.game.canvas.dataset.ambience = JSON.stringify({
        quality,
        reduced: this.reduced.matches,
        flurry,
        visibleSnow,
        visibleSmoke,
        visibleWind,
        visibleStars,
        visibleLights,
        swaying,
        particleLimit: budget.snow + budget.smoke + budget.wind + budget.stars,
        cpuP95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        engineFps: this.scene.game.loop.actualFps,
        meanFrameMs:
          this.frames.reduce((a, b) => a + b, 0) /
          Math.max(1, this.frames.length),
        palette,
      });
    }
  }
}
