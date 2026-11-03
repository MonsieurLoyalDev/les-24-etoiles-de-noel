import Phaser from "phaser";
import map from "./maps/place-des-lanternes.json";
import manifest from "../../assets-manifest.json";
import {
  advance,
  blocked,
  move,
  visible,
  objectives,
  type Point,
  type Rect,
  type Save,
} from "../domain";
export type View = {
  save: Save;
  dialogue: string;
  target: string;
  location: string;
};
export const controls = { x: 0, y: 0, interact: false, paused: false };
export class Village extends Phaser.Scene {
  state: Save;
  publish: (view: View) => void;
  persist: (s: Save) => void;
  player!: Phaser.GameObjects.Image;
  loyal!: Phaser.GameObjects.Image;
  star?: Phaser.GameObjects.Image;
  glasses: Phaser.GameObjects.Graphics[] = [];
  rects: Rect[] = [];
  trail: Point[] = [];
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  dialogue = "";
  target = "";
  timer = 0;
  lastView = "";
  lastTrail: Point = { x: 0, y: 0 };
  constructor(
    save: Save,
    publish: (v: View) => void,
    persist: (s: Save) => void,
  ) {
    super("village");
    this.state = structuredClone(save);
    this.publish = publish;
    this.persist = persist;
  }
  preload() {
    this.load.spritesheet("ground", manifest.ground.path, {
      frameWidth: 16,
      frameHeight: 16,
    });
    Object.entries(manifest.props).forEach(([k, v]) =>
      this.load.image(k, v.path),
    );
    Object.entries(manifest.characters).forEach(([k, v]) =>
      this.load.image(k, v.path),
    );
  }
  create() {
    this.keys = this.input.keyboard!.addKeys(
      "UP,DOWN,LEFT,RIGHT,W,A,S,D,Z,Q,E,SPACE",
    ) as typeof this.keys;
    this.input.keyboard!.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);
    this.input.keyboard!.on("keydown-E", () => this.interact());
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.dialogue) this.interact();
    });
    this.renderRoom();
    if (this.state.stage === 0)
      this.dialogue =
        "Loyal — Bienvenue à Étoilebois, Debby. J’ai préparé une petite surprise pour toi. Approche-toi de moi et parlons…";
    this.emit();
  }
  label(x: number, y: number, text: string, size = 9) {
    return this.add
      .text(x, y, text, {
        fontFamily: "monospace",
        fontSize: size,
        color: "#fff0ce",
        backgroundColor: "#19243be6",
        padding: { x: 5, y: 3 },
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(y + 80);
  }
  renderRoom() {
    this.children.removeAll(true);
    this.rects = [];
    this.trail = [];
    let w = 1024,
      h = 768;
    if (this.state.room === "village") {
      map.ground.forEach((row, y) =>
        row.forEach((frame, x) =>
          this.add
            .image(x * 16, y * 16, "ground", frame)
            .setOrigin(0)
            .setTint(0xbcc8ef),
        ),
      );
      map.props.forEach((p) => {
        if (p.sprite === "quest_star") return;
        const conf = manifest.props[p.sprite as keyof typeof manifest.props];
        this.add
          .image(p.tileX * 16, p.tileY * 16, p.sprite)
          .setOrigin(conf.origin.x, conf.origin.y)
          .setDepth(p.tileY * 16);
        if (p.solid)
          this.rects.push({
            x: p.tileX * 16 - 14,
            y: p.tileY * 16 - 9,
            w: 28,
            h: 15,
          });
        if (p.sprite === "lantern")
          this.add
            .circle(p.tileX * 16, p.tileY * 16 - 30, 24, 0xffce72, 0.12)
            .setDepth(1);
      });
      map.buildings.forEach((b) => {
        const x = b.tileX * 16,
          y = b.tileY * 16,
          bw = b.widthTiles * 16,
          bh = b.heightTiles * 16;
        this.rects.push({ x, y, w: bw, h: bh });
        const g = this.add.graphics().setDepth(y + bh - 12);
        g.fillStyle(0x68494b).fillRect(x, y + 24, bw, bh - 24);
        g.fillStyle(0x39364b).fillTriangle(
          x - 8,
          y + 30,
          x + bw / 2,
          y - 10,
          x + bw + 8,
          y + 30,
        );
        g.lineStyle(7, 0xd4e5f5)
          .lineBetween(x - 8, y + 27, x + bw / 2, y - 12)
          .lineBetween(x + bw / 2, y - 12, x + bw + 8, y + 27);
        g.fillStyle(0xe7b85e);
        for (let wx = x + 20; wx < x + bw - 10; wx += 40)
          g.fillRect(wx, y + 48, 15, 20);
        g.fillStyle(0x312b39).fillRect(
          b.entrance.x * 16 - 9,
          y + bh - 28,
          18,
          28,
        );
        this.label(x + bw / 2, y + 36, b.name + "\nfaçade provisoire");
      });
      this.star = this.add
        .image(512, 304, "quest_star")
        .setOrigin(0.5, 0.85)
        .setDepth(410)
        .setVisible(this.state.stage === 4);
    } else {
      w = 480;
      h = 352;
      this.add.rectangle(240, 176, 480, 352, 0x352b40);
      for (let y = 32; y < 336; y += 16)
        for (let x = 32; x < 448; x += 16)
          this.add.rectangle(
            x,
            y,
            15,
            15,
            ((x + y) / 16) % 2 ? 0x735651 : 0x795b54,
          );
      this.rects = [
        { x: 0, y: 0, w: 480, h: 32 },
        { x: 0, y: 0, w: 32, h: 352 },
        { x: 448, y: 0, w: 32, h: 352 },
        { x: 0, y: 336, w: 480, h: 16 },
        { x: 200, y: 100, w: 80, h: 38 },
        { x: 50, y: 50, w: 90, h: 45 },
      ];
      this.add.rectangle(95, 72, 90, 45, 0x93516d);
      this.add.rectangle(240, 119, 80, 38, 0x4c3340);
      this.add.rectangle(240, 110, 20, 12, 0xffecc2);
      this.add.rectangle(240, 330, 35, 12, 0xe7b85e);
      this.label(240, 70, "La maison de Loyal", 14);
      this.label(240, 96, "Une lettre pour Debby");
      this.label(240, 325, "Sortie");
      this.label(95, 52, "Intérieur provisoire");
    }
    if (blocked(this.state.position, this.rects, w, h))
      this.state.position =
        this.state.room === "village" ? { x: 512, y: 608 } : { x: 240, y: 280 };
    const p = this.state.position;
    this.player = this.add.image(p.x, p.y, "debby").setOrigin(0.5, 0.9);
    this.loyal = this.add
      .image(p.x - 28, p.y + 12, "loyal")
      .setOrigin(0.5, 0.9);
    if (blocked(this.loyal, this.rects, w, h)) this.loyal.setPosition(p.x, p.y);
    this.label(p.x, p.y - 46, "Debby", 8).setName("debby-label");
    this.label(this.loyal.x, this.loyal.y - 46, "Loyal", 8).setName(
      "loyal-label",
    );
    // Code-native temporary face overlay: human characters with round glasses.
    this.glasses = [this.player, this.loyal].map((actor) => {
      const g = this.add.graphics();
      g.fillStyle(0xe3b28a).fillRect(-6, -31, 12, 7);
      g.lineStyle(1, 0x392f34)
        .strokeCircle(-3, -28, 2.5)
        .strokeCircle(3, -28, 2.5)
        .lineBetween(-0.5, -28, 0.5, -28);
      return g.setPosition(actor.x, actor.y).setDepth(actor.y + 0.1);
    });
    this.cameras.main
      .setBounds(0, 0, w, h)
      .startFollow(this.player, true, 1, 1);
    this.cameras.main.setZoom(2);
    this.lastTrail = { ...p };
    this.timer = 0;
  }
  candidates() {
    if (this.state.room === "house")
      return [
        { id: "letter", x: 240, y: 143, name: "Lire la lettre" },
        { id: "exit", x: 240, y: 315, name: "Sortir" },
      ];
    return [
      { id: "loyal", x: this.loyal.x, y: this.loyal.y, name: "Parler à Loyal" },
      ...map.buildings.map((b) => ({
        id: b.id === "loyal_house" ? "enter" : "closed",
        x: b.entrance.x * 16,
        y: b.entrance.y * 16 + 9,
        name: b.name,
      })),
      ...map.props
        .filter((p) => p.interaction && p.sprite !== "quest_star")
        .map((p) => ({
          id: p.interaction!,
          x: p.tileX * 16,
          y: p.tileY * 16 + 14,
          name:
            p.interaction === "tree"
              ? "Le sapin des étoiles"
              : p.interaction === "sign"
                ? "Lire le panneau"
                : "Examiner le cadeau",
        })),
    ];
  }
  nearest() {
    return this.candidates()
      .filter(
        (t) =>
          Math.hypot(t.x - this.player.x, t.y - this.player.y) < 43 &&
          visible(this.player, t, this.rects),
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - this.player.x, a.y - this.player.y) -
          Math.hypot(b.x - this.player.x, b.y - this.player.y),
      )[0];
  }
  interact() {
    if (controls.paused) return;
    if (this.dialogue) {
      this.dialogue = "";
      this.emit();
      return;
    }
    const t = this.nearest();
    if (!t) return;
    const old = this.state.stage;
    this.state.stage = advance(old, t.id);
    if (t.id === "enter" || t.id === "exit") {
      this.state.room = t.id === "enter" ? "house" : "village";
      this.state.position =
        t.id === "enter" ? { x: 240, y: 280 } : { x: 800, y: 644 };
      this.renderRoom();
    } else if (t.id === "loyal")
      this.dialogue =
        "Loyal — Debby, chaque étoile sera un souvenir à nous. La première t’attend dans une lettre, sur la table de ma maison au sud-est. Je viens avec toi. ♥";
    else if (t.id === "letter")
      this.dialogue =
        old >= 2
          ? "« Debby, tu rends même les nuits d’hiver plus douces. Voici notre première étoile. Retrouvons-nous au grand sapin. — Loyal »"
          : "Loyal — Cette lettre t’attend. Parlons d’abord dehors, quand tu voudras.";
    else if (t.id === "tree")
      this.dialogue =
        this.state.stage === 4
          ? "Une lumière s’allume. Loyal — Notre premier souvenir, Debby. Et tant d’autres à inventer ensemble. ♥"
          : "Il manque une étoile au sapin. " + objectives[this.state.stage];
    else if (t.id === "sign")
      this.dialogue =
        "Étoilebois · Maison de Loyal au sud-est. Sapin au centre. Démonstration libre : le vrai calendrier de décembre viendra plus tard.";
    else
      this.dialogue =
        t.id === "gift"
          ? "Un cadeau attend son jour. Aucune surprise future n’est disponible dans cette démo."
          : "Ce lieu ouvrira dans une prochaine phase.";
    this.star?.setVisible(this.state.stage === 4);
    this.persist(this.state);
    this.emit();
  }
  emit() {
    const v = {
      save: structuredClone(this.state),
      dialogue: this.dialogue,
      target: this.target,
      location:
        this.state.room === "village"
          ? "Place des Lanternes"
          : "Maison de Loyal",
    };
    const key = JSON.stringify([
      v.save.stage,
      v.save.room,
      v.dialogue,
      v.target,
    ]);
    if (key !== this.lastView) {
      this.lastView = key;
      this.publish(v);
    }
  }
  update(_time: number, delta: number) {
    if (!this.player) return;
    if (controls.interact) {
      controls.interact = false;
      this.interact();
    }
    const w = this.state.room === "village" ? 1024 : 480,
      h = this.state.room === "village" ? 768 : 352;
    let x = controls.x,
      y = controls.y;
    const down = (k: string) => this.keys[k]?.isDown;
    if (down("LEFT") || down("A") || down("Q")) x--;
    if (down("RIGHT") || down("D")) x++;
    if (down("UP") || down("W") || down("Z")) y--;
    if (down("DOWN") || down("S")) y++;
    if (!this.dialogue && !controls.paused) {
      const len = Math.hypot(x, y) || 1,
        speed = Math.min(delta, 40) * 0.105;
      this.state.position = move(
        this.player,
        (x / len) * speed,
        (y / len) * speed,
        this.rects,
        w,
        h,
      );
      this.player.setPosition(this.state.position.x, this.state.position.y);
      if (
        Math.hypot(
          this.player.x - this.lastTrail.x,
          this.player.y - this.lastTrail.y,
        ) > 4
      ) {
        this.trail.push({ ...this.state.position });
        this.lastTrail = { ...this.state.position };
      }
      if (this.trail.length > 8) {
        const p = this.trail[0],
          d = Math.hypot(p.x - this.loyal.x, p.y - this.loyal.y);
        const n = move(
          this.loyal,
          ((p.x - this.loyal.x) / Math.max(1, d)) * Math.min(d, speed * 1.2),
          ((p.y - this.loyal.y) / Math.max(1, d)) * Math.min(d, speed * 1.2),
          this.rects,
          w,
          h,
        );
        if (
          Math.hypot(n.x - this.loyal.x, n.y - this.loyal.y) < 0.1 &&
          d > 10
        ) {
          this.timer += delta;
          if (this.timer > 1200) {
            this.loyal.setPosition(p.x, p.y);
            this.timer = 0;
          }
        } else {
          this.loyal.setPosition(n.x, n.y);
          this.timer = 0;
        }
        if (d < 6) this.trail.shift();
      }
      if (this.trail.length > 100) this.trail.shift();
    }
    this.player.setDepth(this.player.y);
    this.loyal.setDepth(this.loyal.y);
    [this.player, this.loyal].forEach((p, i) =>
      this.glasses[i]?.setPosition(p.x, p.y).setDepth(p.y + 0.1),
    );
    for (const [name, p] of [
      ["debby-label", this.player],
      ["loyal-label", this.loyal],
    ] as const) {
      const label = this.children.getByName(name) as Phaser.GameObjects.Text;
      label.setPosition(p.x, p.y - 46).setDepth(p.y + 80);
    }
    this.target = this.dialogue ? "Continuer" : (this.nearest()?.name ?? "");
    this.emit();
  }
}
