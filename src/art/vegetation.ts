import type Phaser from "phaser";
import { variantAssets, chooseVegetation } from "./vegetation-design";
export const refinedAssets = {
  vegetation_pine_large: "/assets/refinements-d21/fir-source.png",
  vegetation_bush_snow: "/assets/refinements-d21/bush-source.png",
  vegetation_bush_berries: "/assets/refinements-d21/berries-source.png",
};
export const allVegetationAssets = { ...refinedAssets, ...variantAssets };
export function vegetationKey(key: string, x?: number, y?: number) {
  return key in allVegetationAssets
    ? `refined-${chooseVegetation(key, x, y)}`
    : null;
}
export function prepareVegetation(scene: Phaser.Scene) {
  const audit: { key: string; transparent: boolean; cornerAlpha: number[] }[] =
    [];
  for (const key of Object.keys(allVegetationAssets)) {
    const target = vegetationKey(key)!;
    if (scene.textures.exists(target)) continue;
    const source = scene.textures
      .get(`raw-${target}`)
      .getSourceImage() as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = source.width,
      top = source.height,
      right = 0,
      bottom = 0;
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++)
        if (pixels[(y * canvas.width + x) * 4 + 3] > 16) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    const cornerAlpha = [
      pixels[3],
      pixels[(canvas.width - 1) * 4 + 3],
      pixels[(canvas.height - 1) * canvas.width * 4 + 3],
      pixels[pixels.length - 1],
    ];
    audit.push({
      key,
      transparent: cornerAlpha.every((a) => a === 0),
      cornerAlpha,
    });
    left = Math.max(0, left - 2);
    top = Math.max(0, top - 2);
    right = Math.min(source.width - 1, right + 2);
    bottom = Math.min(source.height - 1, bottom + 2);
    const w = right - left + 1,
      h = bottom - top + 1,
      scale = Math.min(1, 256 / Math.max(w, h));
    const texture = scene.textures.createCanvas(
      target,
      Math.ceil(w * scale),
      Math.ceil(h * scale),
    )!;
    texture.context.imageSmoothingEnabled = false;
    texture.context.drawImage(
      source,
      left,
      top,
      w,
      h,
      0,
      0,
      texture.width,
      texture.height,
    );
    texture.refresh();
  }
  if (audit.length) {
    scene.game.canvas.dataset.vegetationAudit = JSON.stringify(
      audit.filter((a) => a.key in refinedAssets),
    );
    scene.game.canvas.dataset.vegetationVariantsAudit = JSON.stringify(audit);
  }
}
export function fittedVegetationWidth(
  width: number,
  x: number,
  y: number,
  ratio: number,
) {
  return Math.min(
    width,
    128 * ratio,
    Math.max(1, (y - 3) * ratio),
    Math.max(1, (1024 - x) * 2 - 2),
    Math.max(1, x * 2 - 2),
  );
}
