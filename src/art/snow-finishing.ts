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
    for (let y = 0; y < ctx.canvas.height; y += 1024)
      for (let x = 0; x < ctx.canvas.width; x += 1024)
        ctx.drawImage(
          scene.textures.get("d31-" + key).getSourceImage() as HTMLImageElement,
          x,
          y,
          1024,
          1024,
        );
    scene.textures.remove("d31-" + key);
  }
  ctx.restore();
}
