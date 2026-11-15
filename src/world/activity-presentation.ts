import type Phaser from "phaser";
import celestine from "./pose-celestine.json";
import emile from "./pose-emile.json";
import augustin from "./pose-augustin.json";
import { clips } from "./activity-clips";
import type { LivingActor, LivingWorld } from "./runtime";
import { readGraphics } from "../art/graphics";
type PoseSheet = typeof celestine;
const sheets: Record<string, PoseSheet> = { celestine, emile, augustin };
export function preloadActivities(scene: Phaser.Scene) {
  for (const [name, sheet] of Object.entries(sheets))
    scene.load.atlas(
      "activity-" + name,
      "/assets/activities-d42/" + name + ".png",
      sheet,
    );
}
export class ActivityPresentation {
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  private arms = new Map<string, Phaser.GameObjects.Image[]>();
  beginFrame() {
    for (const images of this.arms.values())
      for (const image of images) image.setVisible(false);
  }
  private rendered = new Map<
    string,
    { texture: string; frame: string; x: number; y: number }
  >();
  constructor(
    private scene: Phaser.Scene,
    private world: LivingWorld,
  ) {}
  render(
    sprite: Phaser.GameObjects.Sprite,
    a: LivingActor,
    visible: boolean,
    _hidden: boolean,
  ) {
    const state = this.world.activities.get(a.id);
    const point = this.world.point(a);
    const seated =
      !!state?.clip &&
      clips[state.clip].posture === "seated" &&
      state.frame !== null;
    if (!state || state.frame === null || !state.clip) {
      this.rendered.delete(a.id);
      return false;
    }
    if (!visible) {
      this.rendered.delete(a.id);
      return true;
    }
    const clip = clips[state.clip],
      sheet = sheets[clip.sheet],
      reduced = this.reduced.matches || readGraphics() === "none";
    const frame = state.interrupted
      ? state.frame
      : reduced
        ? clip.loop[0]
        : state.frame;
    const metric = sheet.metrics[String(frame) as keyof typeof sheet.metrics],
      name = "pose-" + frame,
      key = "activity-" + clip.sheet;
    if (sprite.texture.key !== key || sprite.frame.name !== name) {
      sprite.anims.stop();
      sprite.setTexture(key, name);
    }
    sprite
      .setFlipX(state.flip)
      .setAngle(0)
      .setScale(52 / sheet.referenceHeight)
      .setOrigin(
        (state.flip ? sprite.frame.width - metric.anchorX : metric.anchorX) /
          sprite.frame.width,
        metric.foot / sprite.frame.height,
      );
    if (seated && point?.seatProjection) {
      const projection = point.seatProjection,
        progress = reduced ? 1 : state.seatProgress;
      sprite
        .setPosition(
          a.position.x + projection.offset.x * progress,
          a.position.y + projection.offset.y * progress,
        )
        .setDepth(a.position.y + 0.1);
      let arms = this.arms.get(point.id);
      if (!arms) {
        const chair = this.scene.children.list.find(
          (o) =>
            o.name.endsWith(projection.fixture.key) &&
            Math.hypot(
              (o as Phaser.GameObjects.Image).x - projection.fixture.x,
              (o as Phaser.GameObjects.Image).y - projection.fixture.y,
            ) < 0.1,
        ) as Phaser.GameObjects.Image | undefined;
        arms = chair
          ? projection.foreground.map((crop) =>
              this.scene.add
                .image(chair.x, chair.y, chair.texture.key)
                .setOrigin(0.5, 1)
                .setScale(chair.scaleX, chair.scaleY)
                .setCrop(crop.x, crop.y, crop.w, crop.h)
                .setDepth(a.position.y + 0.2)
                .setName("activity:chair-armrest:" + point.id),
            )
          : [];
        this.arms.set(point.id, arms);
      }
      for (const arm of arms) arm.setVisible(true);
    }
    this.rendered.set(a.id, {
      texture: key,
      frame: name,
      x: sprite.x,
      y: sprite.y,
    });
    return true;
  }
  snapshot() {
    return this.world.activities
      .snapshot()
      .map((s) => ({ ...s, drawn: this.rendered.get(s.actor) ?? null }));
  }
}
