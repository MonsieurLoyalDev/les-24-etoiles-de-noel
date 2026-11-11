import type Phaser from "phaser";
import { actorKeys, animateActor, type Actor } from "../art/actors";
import catalog from "../art/catalog.json";
import { actorMetric } from "../art/prepare";
/** Look using an original directional frame; no new pose, recolour or altered proportions. */
const lastPosition = new WeakMap<
  Phaser.GameObjects.Sprite,
  { x: number; y: number }
>();
const facingFrames = new Map<string, string>();
export function faceActor(
  sprite: Phaser.GameObjects.Sprite,
  name: Actor,
  target: { x: number; y: number },
) {
  const last = lastPosition.get(sprite);
  if (!last || last.x !== sprite.x || last.y !== sprite.y) {
    animateActor(sprite);
    lastPosition.set(sprite, { x: sprite.x, y: sprite.y });
  }
  const dx = target.x - sprite.x,
    dy = target.y - sprite.y,
    direction =
      Math.abs(dx) > Math.abs(dy)
        ? dx < 0
          ? "gauche"
          : "droite"
        : dy < 0
          ? "haut"
          : "bas";
  const key = actorKeys[name],
    cacheKey = key + ":" + direction;
  const frame =
    facingFrames.get(cacheKey) ??
    Object.keys(catalog.atlases[key].data.frames)
      .filter((f) => f.includes("_" + direction + "_"))
      .sort()[0];
  if (!frame) return;
  facingFrames.set(cacheKey, frame);
  if (
    sprite.texture.key !== key ||
    sprite.frame.name !== frame ||
    sprite.anims.isPlaying
  ) {
    sprite.anims.stop();
    sprite.setTexture(key, frame).setFlipX(false).setAngle(0);
    const metric = actorMetric(sprite.scene, key);
    sprite
      .setOrigin(0.5, metric.foot)
      .setScale((name === "flocon" ? 31 : 52) / metric.height);
  }
}
