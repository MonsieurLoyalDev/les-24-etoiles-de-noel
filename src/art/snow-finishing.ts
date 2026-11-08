import type Phaser from "phaser";
export const snowFinishingAssets = {
  "snow-powder": "/assets/interiors-d31/snow-powder.png",
  "snow-soft": "/assets/interiors-d31/snow-soft.png",
};
/** Only the white undercoat: existing D.3 regions and details are painted afterwards. */
export function finishWhiteSnow(
  scene: Phaser.Scene,
  ctx: CanvasRenderingContext2D,
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const [key, alpha] of [
    ["snow-powder", 0.38],
    ["snow-soft", 0.18],
  ] as const) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      scene.textures.get("d31-" + key).getSourceImage() as HTMLImageElement,
      0,
      0,
      1024,
      1024,
    );
    scene.textures.remove("d31-" + key);
  }
  ctx.restore();
}
