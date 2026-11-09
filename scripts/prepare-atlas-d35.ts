import type Phaser from "phaser";

export const environmentAtlases = {
  benches: {
    columns: 2,
    rows: 2,
    names: ["bench-rustic", "bench-village", "bench-copper", "bench-garden"],
  },
  gifts: {
    columns: 3,
    rows: 3,
    names: [
      "gift-red",
      "gift-tall",
      "gift-cream",
      "gift-pair",
      "gift-trio",
      "gift-kraft",
      "gift-stack",
      "gift-basket",
      "gift-display",
    ],
  },
  firewood: {
    columns: 3,
    rows: 2,
    names: [
      "wood-small",
      "wood-medium",
      "wood-rack",
      "wood-irregular",
      "wood-bundle",
      "wood-kindling",
    ],
  },
  accessories: {
    columns: 3,
    rows: 4,
    names: [
      "prop-lantern",
      "prop-mailbox",
      "prop-planter",
      "prop-table",
      "prop-sled",
      "prop-crates",
      "prop-basket",
      "prop-tools",
      "prop-watering",
      "prop-bare-tree",
      "prop-stump",
      "prop-rocks",
    ],
  },
};
export const fenceStyles = ["rustic", "picket", "logs", "copper"] as const;
export type FenceStyle = (typeof fenceStyles)[number];
export const fenceParts = ["panel", "post", "side", "gate"] as const;
export const environmentKey = (name: string) => "d35-" + name;
export function preloadEnvironment35(scene: Phaser.Scene) {
  for (const file of [...Object.keys(environmentAtlases), "fences", "paths"])
    scene.load.image(
      "source-d35-" + file,
      `/assets/environment-d35/${file}.png`,
    );
}
/** Extract named, alpha-trimmed atlas cells; the full sheets are never displayed as props. */
export function prepareEnvironment35(scene: Phaser.Scene) {
  const audit: {
    name: string;
    source: string;
    bounds: number[];
    width: number;
    height: number;
    corners: number[];
  }[] = [];
  const extract = (
    source: string,
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    const key = environmentKey(name);
    if (scene.textures.exists(key)) return;
    const image = scene.textures
      .get("source-d35-" + source)
      .getSourceImage() as HTMLImageElement;
    const cell = document.createElement("canvas");
    cell.width = w;
    cell.height = h;
    const c = cell.getContext("2d", { willReadFrequently: true })!;
    c.drawImage(image, x, y, w, h, 0, 0, w, h);
    const data = c.getImageData(0, 0, w, h).data;
    let left = w,
      right = -1,
      top = h,
      bottom = -1;
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++) {
        if (data[(py * w + px) * 4 + 3] > 48) {
          left = Math.min(left, px);
          right = Math.max(right, px);
          top = Math.min(top, py);
          bottom = Math.max(bottom, py);
        }
      }
    if (right < left) throw Error("Empty atlas cell: " + name);
    // Two real transparent pixels around every exported frame prevent texture bleeding.
    const cw = right - left + 1,
      ch = bottom - top + 1,
      scale = Math.min(1, 256 / Math.max(cw, ch));
    const texture = scene.textures.createCanvas(
      key,
      Math.ceil(cw * scale) + 4,
      Math.ceil(ch * scale) + 4,
    )!;
    texture.context.imageSmoothingEnabled = false;
    texture.context.drawImage(
      cell,
      left,
      top,
      cw,
      ch,
      2,
      2,
      texture.width - 4,
      texture.height - 4,
    );
    texture.refresh();
    audit.push({
      name,
      source,
      bounds: [x + left, y + top, cw, ch],
      width: texture.width,
      height: texture.height,
      corners: [
        data[3],
        data[(w - 1) * 4 + 3],
        data[(h - 1) * w * 4 + 3],
        data[data.length - 1],
      ],
    });
  };
  for (const [source, spec] of Object.entries(environmentAtlases)) {
    const im = scene.textures.get("source-d35-" + source).getSourceImage();
    spec.names.forEach((name, i) => {
      const col = i % spec.columns,
        row = Math.floor(i / spec.columns);
      if (source === "firewood" && row === 0) {
        const [left, right] = [
          [0, 475],
          [475, 960],
          [960, 1536],
        ][col];
        extract(source, name, left, 0, right - left, 512);
        return;
      }
      const x = Math.round((col * im.width) / spec.columns),
        y = Math.round((row * im.height) / spec.rows);
      extract(
        source,
        name,
        x,
        y,
        Math.round(((col + 1) * im.width) / spec.columns) - x,
        Math.round(((row + 1) * im.height) / spec.rows) - y,
      );
    });
  }
  // This atlas has intentionally wider infill panels; do not assume equal column widths.
  const columns = [
    [0, 425],
    [440, 650],
    [710, 870],
    [980, 1254],
  ];
  const image = scene.textures.get("source-d35-fences").getSourceImage();
  fenceStyles.forEach((style, row) =>
    fenceParts.forEach((part, col) => {
      const y = Math.round((row * image.height) / 4),
        [x, end] = columns[col];
      extract(
        "fences",
        `fence-${style}-${part}`,
        x,
        y,
        Math.min(end, image.width) - x,
        Math.round(((row + 1) * image.height) / 4) - y,
      );
    }),
  );
  if (audit.length) scene.game.canvas.dataset.assets35 = JSON.stringify(audit);
}
