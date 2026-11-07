import Phaser from "phaser";
import catalog from "./catalog.json";
import { actorMetric } from "./prepare";

export const actorKeys = {
  debby: "debby_atlas-Etoilebois_Debby_V3_Propre",
  loyal: "loyal_atlas-Etoilebois_Loyal_V9_Attente",
  profile: "atlas-Etoilebois_Loyal_V19_1",
  augustin: "augustin_atlas-Etoilebois_Augustin_V4_Entier",
  madeleine: "madeleine_atlas-Etoilebois_Madeleine_V7",
  celestine: "celestine_atlas-Etoilebois_Celestine_V1",
  basile: "basile_atlas-Etoilebois_Basile_V1",
  emile: "emile_atlas-Etoilebois_Emile_V1",
  flocon: "flocon_atlas-Etoilebois_Flocon_V4_Transparent",
} as const;
export type Actor = Exclude<keyof typeof actorKeys, "profile">;
export const residentActors: Record<string, Actor> = {
  mira: "celestine",
  oscar: "basile",
  alma: "madeleine",
  noe: "augustin",
};
const previous = new WeakMap<
  Phaser.GameObjects.Sprite,
  { x: number; y: number; direction: string }
>();
export function preloadActors(scene: Phaser.Scene) {
  for (const key of Object.values(actorKeys)) {
    const atlas = catalog.atlases[key];
    scene.load.atlas(key, atlas.image, atlas.data);
  }
  const idle =
    catalog.atlases["augustin_idle_atlas-Etoilebois_Augustin_Idle_V5"];
  scene.load.atlas("augustin-idle", idle.image, idle.data);
}
export function createActorAnimations(scene: Phaser.Scene) {
  for (const [actor, key] of Object.entries(actorKeys)) {
    const data = catalog.atlases[key].data;
    for (const direction of actor === "profile"
      ? ["right"]
      : ["haut", "bas", "gauche", "droite", "attente"]) {
      const frames = Object.keys(data.frames)
        .filter((f) => f.includes(`_${direction}_`))
        .sort();
      const name = `${actor}-${direction}`;
      if (frames.length && !scene.anims.exists(name))
        scene.anims.create({
          key: name,
          frames: frames.map((frame) => ({ key, frame })),
          frameRate: direction === "attente" ? 2 : actor === "profile" ? 10 : 6,
          repeat: -1,
        });
    }
  }
  if (!scene.anims.exists("augustin-attente-v5"))
    scene.anims.create({
      key: "augustin-attente-v5",
      frames: scene.anims.generateFrameNames("augustin-idle", {
        prefix: "augustin_idle_",
        start: 1,
        end: 4,
        zeroPad: 2,
      }),
      frameRate: 2,
      repeat: -1,
    });
}
export function actor(scene: Phaser.Scene, name: Actor, x: number, y: number) {
  const key = actorKeys[name],
    frame = Object.keys(catalog.atlases[key].data.frames).find((f) =>
      f.includes("attente"),
    )!;
  const sprite = scene.add
    .sprite(x, y, key, frame)
    .setOrigin(0.5, 0.98)
    .setName(name);
  sprite.setData("actor", name);
  animateActor(sprite);
  return sprite;
}
export function animateActor(sprite: Phaser.GameObjects.Sprite) {
  const name = sprite.getData("actor") as Actor,
    old = previous.get(sprite);
  const dx = old ? sprite.x - old.x : 0,
    dy = old ? sprite.y - old.y : 0,
    moving = Math.hypot(dx, dy) > 0.08;
  const direction = moving
    ? Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "droite"
        : "gauche"
      : dy > 0
        ? "bas"
        : "haut"
    : (old?.direction ?? "bas");
  const profile =
    name === "loyal" &&
    moving &&
    (direction === "droite" || direction === "gauche");
  const key = profile
    ? "profile-right"
    : !moving && name === "augustin"
      ? "augustin-attente-v5"
      : `${name}-${moving ? direction : "attente"}`;
  sprite
    .play(key, true)
    .setFlipX(profile && direction === "gauche")
    .setAngle(0);
  // Uniform perceived height; origin is shared across all frames, never re-trimmed per pose.
  const metric = actorMetric(sprite.scene, sprite.texture.key);
  sprite
    .setOrigin(0.5, metric.foot)
    .setScale((name === "flocon" ? 31 : 52) / metric.height);
  previous.set(sprite, { x: sprite.x, y: sprite.y, direction });
}
