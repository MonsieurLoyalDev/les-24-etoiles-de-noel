import Phaser from "phaser";
import { fitTag, type TagBox } from "./tag-layout";
export type ActorTag = {
  actor: Phaser.GameObjects.Sprite;
  plate: Phaser.GameObjects.Container;
  name: string;
};
export type SignTag = {
  plate: Phaser.GameObjects.Container;
  x: number;
  y: number;
  roofY: number;
};
// Code-native frame: dynamic text remains separate from the reusable wood/copper ornament.
export function plaque(scene: Phaser.Scene, text: string, sign = false) {
  const label = scene.add
    .text(0, 0, text, {
      fontFamily: sign ? "Marcellus" : "Nunito",
      fontStyle: sign ? "normal" : "bold",
      fontSize: sign ? 10 : 9,
      resolution: 2,
      color: "#ffedd0",
      align: "center",
      lineSpacing: 0,
      padding: { x: 7, y: sign ? 5 : 3 },
      wordWrap: sign ? { width: 100, useAdvancedWrap: true } : undefined,
    })
    .setOrigin(0.5, 1);
  const w = Math.ceil(label.width),
    h = Math.ceil(label.height);
  const g = scene.add.graphics();
  g.fillStyle(0x172129, 0.35).fillRect(-w / 2 + 1, -h + 2, w, h);
  g.fillStyle(0x4b3026).fillRect(-w / 2, -h, w, h);
  g.fillStyle(0x241d1a).fillRect(-w / 2 + 2, -h + 2, w - 4, h - 4);
  g.lineStyle(1, 0xb98150, 1).strokeRect(-w / 2 + 0.5, -h + 0.5, w - 1, h - 1);
  g.lineStyle(1, 0x76503a, 0.18);
  for (let y = -h + 5; y < -2; y += 5)
    g.lineBetween(-w / 2 + 3, y, w / 2 - 3, y);
  g.fillStyle(0xe8d9b7);
  g.fillRect(-w / 2 + 2, -h + 2, 1, 1).fillRect(w / 2 - 3, -3, 1, 1);
  if (sign) {
    g.fillStyle(0xd4e0ee).fillRect(-w / 2 + 3, -h - 1, w * 0.37, 2);
    g.fillStyle(0xf1f3f6).fillRect(-w / 2 + 5, -h - 2, w * 0.24, 2);
    g.fillRect(w * 0.18, -h - 1, w * 0.23, 2);
  }
  return scene.add
    .container(0, 0, [g, label])
    .setSize(w, h)
    .setDepth(10001)
    .setData("text", text);
}
export function updateTags(
  scene: Phaser.Scene,
  tags: ActorTag[],
  signs: SignTag[],
  player: Phaser.GameObjects.Sprite,
  hidden: boolean,
) {
  const cam = scene.cameras.main,
    v = cam.worldView;
  const view = { x: v.x, y: v.y, w: v.width, h: v.height };
  const occupied: TagBox[] = [];
  const diagnostics: {
    name: string;
    visible: boolean;
    x: number;
    y: number;
    w: number;
    h: number;
  }[] = [];
  for (const t of tags) {
    const height = t.name === "Flocon" ? 31 : 52;
    const onscreen =
      t.actor.x >= v.x &&
      t.actor.x <= v.right &&
      t.actor.y - height >= v.y + t.plate.height + 7 &&
      t.actor.y - height <= v.bottom;
    t.plate.setVisible(!hidden && onscreen);
    const box = fitTag(
      {
        x: t.actor.x - t.plate.width / 2,
        y: t.actor.y - height - 4 - t.plate.height,
        w: t.plate.width,
        h: t.plate.height,
      },
      view,
      occupied,
    );
    const snap = (value: number) => Math.round(value * cam.zoom) / cam.zoom;
    t.plate.setPosition(snap(box.x + box.w / 2), snap(box.y + box.h));
    if (t.plate.visible) occupied.push(box);
    diagnostics.push({
      name: t.name,
      visible: t.plate.visible,
      x: (box.x - v.x) * cam.zoom,
      y: (box.y - v.y) * cam.zoom,
      w: box.w * cam.zoom,
      h: box.h * cam.zoom,
    });
  }
  const nearest = signs
    .slice()
    .sort(
      (a, b) =>
        Math.hypot(player.x - a.x, player.y - a.y) -
        Math.hypot(player.x - b.x, player.y - b.y),
    )[0];
  for (const s of signs) {
    s.plate.setVisible(
      !hidden &&
        s === nearest &&
        Math.hypot(player.x - s.x, player.y - s.y) < 145,
    );
    const box = fitTag(
      {
        x: s.x - s.plate.width / 2,
        y: s.roofY - s.plate.height,
        w: s.plate.width,
        h: s.plate.height,
      },
      view,
    );
    s.plate.setPosition(box.x + box.w / 2, box.y + box.h);
  }
  scene.game.canvas.dataset.nameTags = JSON.stringify(diagnostics);
  scene.game.canvas.dataset.signTags = JSON.stringify(
    signs.map((s) => ({
      text: s.plate.getData("text"),
      visible: s.plate.visible,
    })),
  );
}
