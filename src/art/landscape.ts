import type Phaser from "phaser";
import map from "../game/maps/place-des-lanternes.json";
import { courts, lanes, decorations } from "./village-design";
import { texturedSnow, snowAccents } from "./snow-detail";
function macro(ctx: CanvasRenderingContext2D, image: CanvasImageSource) {
  // Mirrored macro-chunks share the same edge texels. No random tile permutation or seam every 16 px.
  for (let y = 0; y < 2; y++)
    for (let x = 0; x < 2; x++) {
      ctx.save();
      ctx.translate(x * 512 + (x ? 512 : 0), y * 512 + (y ? 512 : 0));
      ctx.scale(x ? -1 : 1, y ? -1 : 1);
      ctx.drawImage(image, 0, 0, 512, 512);
      ctx.restore();
    }
}
function mask(material: "stone" | "dirt") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const lane of lanes.filter((l) => l.material === material)) {
    ctx.beginPath();
    lane.points.forEach((p, i) =>
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
    );
    ctx.lineWidth = lane.width;
    ctx.stroke();
  }
  if (material === "stone")
    for (const c of courts) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  return canvas;
}
function contact(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  opacity = 0.12,
) {
  for (let i = 3; i > 0; i--) {
    ctx.fillStyle = `rgba(63,76,92,${opacity / (i + 1)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2 + i * 2, 3 + i, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
export function landscape(
  scene: Phaser.Scene,
  buildingWidths: Record<string, number>,
) {
  const key = "village-floor-d21";
  if (!scene.textures.exists(key)) {
    const floor = scene.textures.createCanvas(key, 1024, 768)!,
      ctx = floor.context;
    const snow = scene.textures
      .get("quiet-snow")
      .getSourceImage() as HTMLCanvasElement;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(snow, 0, 0);
    texturedSnow(scene, ctx);
    for (const material of ["dirt", "stone"] as const) {
      const layer = document.createElement("canvas");
      layer.width = 1024;
      layer.height = 768;
      const paint = layer.getContext("2d")!;
      paint.imageSmoothingEnabled = false;
      macro(
        paint,
        scene.textures
          .get(material === "stone" ? "art-stone" : "art-dirt")
          .getSourceImage() as HTMLImageElement,
      );
      paint.globalCompositeOperation = "destination-in";
      paint.drawImage(mask(material), 0, 0);
      ctx.globalAlpha = material === "stone" ? 0.9 : 0.55;
      ctx.drawImage(layer, 0, 0);
      ctx.globalAlpha = 1;
    }
    // A thin snow-tinted edge joins the same materials, never a foreign autotile across a whole cell.
    ctx.strokeStyle = "rgba(231,237,242,.48)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const c of courts) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    for (const b of map.buildings)
      contact(
        ctx,
        b.entrance.x * 16,
        b.entrance.y * 16 + 1,
        buildingWidths[b.id] * 0.86,
        0.17,
      );
    contact(ctx, 512, 394, 168, 0.13);
    for (const d of decorations)
      if (!d.overhead)
        contact(
          ctx,
          d.x,
          d.y - 1,
          d.width * (d.key.includes("pine") ? 0.46 : 0.6),
          d.back ? 0.06 : 0.1,
        );
    for (const p of map.props)
      if (p.sprite !== "quest_star")
        contact(ctx, p.tileX * 16, p.tileY * 16, 26, 0.09);
    snowAccents(ctx);
    floor.refresh();
  }
  return scene.add.image(0, 0, key).setOrigin(0).setDepth(-100);
}
