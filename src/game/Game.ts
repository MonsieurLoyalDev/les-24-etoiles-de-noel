import catalog from "../art/catalog.json";
import { playSound, stopAmbience } from "../art/audio";
import {
  preloadActors,
  createActorAnimations,
  actor,
  animateActor,
  residentActors,
} from "../art/actors";
import { reaction } from "../art/reactions";
import {
  preloadWorld,
  drawGround,
  buildingArt,
  propArt,
  decorate,
  prepareWorld,
  buildingWidths,
} from "../art/world";
import { cleanKey } from "../art/prepare";
import { plaque, updateTags, type ActorTag, type SignTag } from "../art/tags";
import { signNames } from "../art/tag-layout";
import { vegetationKey } from "../art/vegetation";
import Phaser from "phaser";
import map from "./maps/place-des-lanternes.json";
import manifest from "../../assets-manifest.json";
import { sendEvent } from "../rpg/quests";
import {
  dialogues,
  choicesFor,
  choose,
  type DialogueGraph,
} from "../rpg/dialogue";
import {
  rooms,
  roomNames,
  interiorRects,
  citizens,
  period,
  periodNames,
  npcActivity,
} from "../rpg/world";
import type { MiniKind } from "../ui/MiniGame";
import type { Day, Step } from "../advent/model";
import {
  blocked,
  move,
  movementDistance,
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
  choices: string[];
  miniGame: MiniKind | null;
  period: string;
  activity: string;
  transitioning: boolean;
  adventRequested: number;
  huntFound: string[];
  finalCompleted: number;
  cinematic: boolean;
  adventStars: number;
};
export const controls = { x: 0, y: 0, interact: false, paused: false };
export class Village extends Phaser.Scene {
  state: Save;
  publish: (view: View) => void;
  persist: (s: Save) => void;
  player!: Phaser.GameObjects.Sprite;
  loyal!: Phaser.GameObjects.Sprite;
  star?: Phaser.GameObjects.Image;
  tree?: Phaser.GameObjects.Image;
  glasses: Phaser.GameObjects.Graphics[] = [];
  rects: Rect[] = [];
  trail: Point[] = [];
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  dialogue = "";
  target = "";
  timer = 0;
  lastView = "";
  lastTrail: Point = { x: 0, y: 0 };
  activeDialogue: { graph: DialogueGraph; id: string; key: string } | null =
    null;
  miniGame: MiniKind | null = null;
  npcs: {
    id: string;
    name: string;
    image: Phaser.GameObjects.Sprite;
    path: Point[];
    step: number;
  }[] = [];
  actorTags: ActorTag[] = [];
  signTags: SignTag[] = [];
  shade!: Phaser.GameObjects.Rectangle;
  snow: Phaser.GameObjects.Arc[] = [];
  lamps: Phaser.GameObjects.Arc[] = [];
  smoke: {
    puff: Phaser.GameObjects.Arc;
    x: number;
    y: number;
    phase: number;
  }[] = [];
  decorations: Phaser.GameObjects.Arc[] = [];
  frame = 0;
  lastEEvent = -1;
  lastPortalAt = -Infinity;
  lastFootstep = 0;
  adventDay: Day | null = null;
  adventRequested = 0;
  adventLights: number[] = [];
  adventMarker?: Phaser.GameObjects.Container;
  adventDecor: Phaser.GameObjects.Arc[] = [];
  hunt: { step: Step; found: string[] } | null = null;
  huntMarker?: Phaser.GameObjects.Container;
  finalSequence: { beat: number; message: string } | null = null;
  finalCompleted = 0;
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
    preloadWorld(this);
    preloadActors(this);
    const tree = catalog.atlases["sapin_atlas-Etoilebois_Sapin_V11_4"];
    this.load.atlas("art-tree", tree.image, tree.data);
    this.load.spritesheet("ground", manifest.ground.path, {
      frameWidth: 16,
      frameHeight: 16,
    });
    Object.entries(manifest.props).forEach(([k, v]) =>
      this.load.image(k, v.path),
    );
  }
  create() {
    prepareWorld(this);
    this.cameras.main.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, () =>
      updateTags(
        this,
        this.actorTags,
        this.signTags,
        this.player,
        !!this.dialogue || controls.paused,
      ),
    );
    this.scale.on(Phaser.Scale.Events.RESIZE, () =>
      this.cameras.main.setZoom(this.scale.width < 700 ? 1.5 : 2),
    );
    createActorAnimations(this);
    this.keys = this.input.keyboard!.addKeys(
      "UP,DOWN,LEFT,RIGHT,W,A,S,D,Z,Q,E,SPACE",
    ) as typeof this.keys;
    this.input.keyboard!.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE"]);
    this.input.keyboard!.on("keydown-E", (event: KeyboardEvent) => {
      if (event.repeat || event.timeStamp === this.lastEEvent) return;
      this.lastEEvent = event.timeStamp;
      this.interact();
    });
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.dialogue) this.interact();
    });
    this.renderRoom();
    if (this.state.stage === 0)
      this.dialogue =
        "Loyal — Bienvenue à Étoilebois, Debby. J’ai préparé une petite surprise pour toi. Approche-toi de moi et parlons…";
    const conversation = this.state.conversation;
    if (conversation) {
      const graph = dialogues[conversation.key as keyof typeof dialogues];
      if (graph && (graph as DialogueGraph)[conversation.node])
        this.openDialogue(conversation.key, graph, conversation.node);
      else this.state.conversation = null;
    }
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
    stopAmbience();
    playSound(this.state.room === "village" ? "wind" : "fire", true);
    this.children.removeAll(true);
    this.adventMarker = undefined;
    this.huntMarker = undefined;
    this.adventDecor = [];
    this.star = undefined;
    this.tree = undefined;
    this.npcs = [];
    this.actorTags = [];
    this.signTags = [];
    this.lamps = [];
    this.smoke = [];
    this.decorations = [];
    this.rects = [];
    this.trail = [];
    let w = 1024,
      h = 768;
    if (this.state.room === "village") {
      drawGround(this);
      decorate(this);
      map.props.forEach((p) => {
        if (p.sprite === "quest_star") return;
        if (p.sprite === "pine_festive") {
          this.tree = this.add
            .image(512, 394, "art-tree", "sapin_00")
            .setOrigin(0.5, 1)
            .setDepth(384)
            .setScale(0.9);
          this.rects.push({ x: 498, y: 375, w: 28, h: 15 });
          return;
        }
        const conf = manifest.props[p.sprite as keyof typeof manifest.props];
        const replacement = propArt[p.sprite];
        const prop = this.add
          .image(
            p.tileX * 16,
            p.tileY * 16,
            replacement
              ? (vegetationKey(replacement.key, p.tileX * 16, p.tileY * 16) ??
                  (this.textures.exists(cleanKey(replacement.key))
                    ? cleanKey(replacement.key)
                    : "art-" + replacement.key))
              : p.sprite,
          )
          .setOrigin(conf.origin.x, conf.origin.y)
          .setDepth(p.tileY * 16);
        if (replacement)
          prop.setScale(replacement.width / prop.width).setOrigin(0.5, 1);
        if (p.sprite === "pine_large") {
          const facade = map.buildings.find(
            (b) =>
              p.tileX >= b.tileX &&
              p.tileX <= b.tileX + b.widthTiles &&
              p.tileY >= b.tileY &&
              p.tileY <= b.tileY + b.heightTiles,
          );
          if (facade) prop.setDepth(facade.tileY * 16 - 1);
        }
        if (p.solid)
          this.rects.push({
            x: p.tileX * 16 - 14,
            y: p.tileY * 16 - 9,
            w: 28,
            h: 15,
          });
        if (p.sprite === "lantern")
          this.lamps.push(
            this.add
              .circle(p.tileX * 16, p.tileY * 16 - 46, 11, 0xffce72, 1)
              .setDepth(p.tileY * 16 + 1),
          );
      });
      map.buildings.forEach((b) => {
        const x = b.tileX * 16,
          y = b.tileY * 16,
          bw = b.widthTiles * 16,
          bh = b.heightTiles * 16;
        this.rects.push({ x, y, w: bw, h: bh });
        const facade = this.add
          .image(b.entrance.x * 16, y + bh, cleanKey(buildingArt[b.id]))
          .setOrigin(0.5, 1)
          .setDepth(y + bh - 12);
        facade.setScale(buildingWidths[b.id] / facade.width);
        for (let i = 0; i < 3; i++) {
          const sx = b.entrance.x * 16 - bw * 0.3,
            sy = y + bh - facade.displayHeight * 0.8;
          this.smoke.push({
            puff: this.add
              .circle(sx, sy, 3, 0xd6d9e4, 0.1)
              .setDepth(y + bh + 1),
            x: sx,
            y: sy,
            phase: i / 3,
          });
        }
        const plate = plaque(
          this,
          signNames[b.id as keyof typeof signNames],
          true,
        )
          .setPosition(b.entrance.x * 16, y + bh - facade.displayHeight - 4)
          .setDepth(y + bh + 1);
        this.signTags.push({
          plate,
          x: b.entrance.x * 16,
          y: y + bh,
          roofY: y + bh - facade.displayHeight - 4,
        });
      });
      this.star = this.add
        .image(512, 304, "quest_star")
        .setOrigin(0.5, 0.85)
        .setDepth(410)
        .setVisible(this.state.stage === 4);
    } else {
      w = 480;
      h = 352;
      const config = rooms[this.state.room];
      this.add.rectangle(240, 176, 480, 352, 0x352b40);
      for (let y = 32; y < 336; y += 16)
        for (let x = 32; x < 448; x += 16)
          this.add.rectangle(x, y, 15, 15, config.color);
      this.rects = [...interiorRects];
      this.add.rectangle(95, 72, 90, 45, config.furniture);
      this.add.rectangle(385, 95, 70, 50, config.furniture);
      this.add.rectangle(240, 119, 80, 38, 0x4c3340);
      this.add.rectangle(240, 110, 20, 12, 0xffecc2);
      this.add.rectangle(240, 330, 35, 12, 0xe7b85e);
      this.label(240, 58, roomNames[this.state.room], 12);
      this.label(240, 96, config.object);
      this.label(240, 325, "Sortie");
      this.label(95, 52, "Intérieur provisoire");
      if (this.state.room === "library") {
        for (let i = 0; i < 6; i++)
          this.add.rectangle(
            60 + i * 12,
            70,
            8,
            27,
            [0xb27686, 0xd6c08b, 0x92a9ba][i % 3],
          );
        this.add.rectangle(370, 237, 42, 24, 0xe3ca97);
        this.label(370, 230, "Photographie");
        this.label(385, 72, "Marque-page");
      }
      if (this.state.room === "workshop") {
        this.add.image(370, 235, "gift").setScale(0.55);
        this.label(385, 72, "Ruban");
        this.add.image(70, 120, "logs").setScale(0.5);
      }
      if (this.state.room === "inn") {
        this.add.image(385, 90, "campfire").setScale(0.65);
        this.add.rectangle(370, 235, 44, 26, 0xa88760);
        this.label(370, 220, "Jeu de mémoire");
      }
    }
    if (blocked(this.state.position, this.rects, w, h))
      this.state.position =
        this.state.room === "village" ? { x: 512, y: 608 } : { x: 240, y: 280 };
    const p = this.state.position;
    this.player = actor(this, "debby", p.x, p.y);
    this.loyal = actor(this, "loyal", p.x - 28, p.y + 12);
    if (blocked(this.loyal, this.rects, w, h)) this.loyal.setPosition(p.x, p.y);
    this.actorTags.push(
      { actor: this.player, plate: plaque(this, "Debby"), name: "Debby" },
      { actor: this.loyal, plate: plaque(this, "Loyal"), name: "Loyal" },
    );
    this.glasses = [];
    this.cameras.main
      .setBounds(0, 0, w, h)
      .startFollow(this.player, true, 1, 1);
    this.cameras.main.setZoom(this.scale.width < 700 ? 1.5 : 2);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      this.cameras.main.fadeIn(180, 16, 28, 36);
    this.lastTrail = { ...p };
    this.timer = 0;
    for (const citizen of citizens.filter((n) => n.room === this.state.room)) {
      const p = citizen.path[0];
      const image = actor(this, residentActors[citizen.id], p.x, p.y);
      this.npcs.push({
        id: citizen.id,
        name: citizen.name,
        image,
        path: citizen.path,
        step: 1,
      });
      this.actorTags.push({
        actor: image,
        plate: plaque(this, citizen.name),
        name: citizen.name,
      });
    }
    if (this.state.room === "village") {
      for (const [id, name, x, y] of [
        ["emile", "Émile", 240, 430],
        ["flocon", "Flocon", 850, 440],
      ] as const) {
        const image = actor(this, id, x, y).setDepth(y).play(`${id}-attente`);
        this.actorTags.push({ actor: image, plate: plaque(this, name), name });
      }
    }
    this.shade = this.add
      .rectangle(0, 0, 1, 1, 0x102348, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(9000);
    this.snow =
      this.state.room === "village"
        ? Array.from({ length: 36 }, (_, i) =>
            this.add
              .circle(
                (i * 73) % 640,
                (i * 47) % 400,
                i % 3 === 0 ? 1.2 : 0.7,
                0xf3f7ff,
                0.7,
              )
              .setScrollFactor(0)
              .setDepth(9010),
          )
        : [];
    this.refreshAdvent();
  }
  setAdventDay(day: Day | null) {
    this.adventDay = day;
    if (this.player) this.refreshAdvent();
  }
  setAdventLights(days: number[]) {
    if (days.length > this.adventLights.length) playSound("star");
    this.adventLights = [...new Set(days)];
    if (this.player) this.refreshAdvent();
    this.emit();
  }
  adventAnchor() {
    return this.state.room === "village"
      ? { x: 512, y: 430 }
      : { x: 300, y: 270 };
  }
  refreshAdvent() {
    this.adventMarker?.destroy();
    this.adventMarker = undefined;
    if (this.adventDay?.room === this.state.room) {
      const p = this.adventAnchor();
      const glow = this.add.circle(0, 0, 12, 0xffce72, 0.35),
        label = this.label(0, -15, `✦ Jour ${this.adventDay.day}`, 9);
      this.adventMarker = this.add
        .container(p.x, p.y, [glow, label])
        .setDepth(p.y + 100);
    }
    this.adventDecor.forEach((x) => x.destroy());
    this.adventDecor = [];
    const count = this.finalSequence
      ? 24
      : Math.min(
          24,
          Math.max(this.adventLights.length, this.state.stars.length),
        );
    this.tree?.setFrame("sapin_" + String(count).padStart(2, "0"));
    this.huntMarker?.destroy();
    this.huntMarker = undefined;
    if (
      this.hunt &&
      this.state.room === "village" &&
      this.hunt.found.length < (this.hunt.step.items?.length ?? 0)
    ) {
      const p = this.huntPoint();
      if (this.hunt.step.style === "loyal") this.loyal.setPosition(p.x, p.y);
      else
        this.huntMarker = this.add
          .container(p.x, p.y, [
            this.add.image(0, -12, "quest_star").setScale(0.4),
            this.label(0, -40, "Petit bonheur", 8),
          ])
          .setDepth(p.y + 1);
    }
  }
  huntPoint() {
    return [
      { x: 560, y: 500 },
      { x: 440, y: 460 },
      { x: 700, y: 500 },
    ][(this.hunt?.found.length ?? 0) % 3];
  }
  startHunt(step: Step, found: string[]) {
    this.hunt = { step, found: [...found] };
    this.trail = [];
    this.refreshAdvent();
    this.emit();
  }
  clearHunt() {
    this.hunt = null;
    this.trail = [];
    this.lastTrail = { ...this.state.position };
    this.refreshAdvent();
  }
  startFinal(message: string) {
    this.activeDialogue = null;
    this.state.conversation = null;
    this.clearHunt();
    this.state.room = "village";
    this.state.position = { x: 512, y: 450 };
    this.finalSequence = { beat: 0, message };
    this.renderRoom();
    this.loyal.setPosition(486, 455);
    this.star?.setVisible(true);
    controls.paused = true;
    this.finalLine();
    this.persist(this.state);
  }
  finalLine() {
    if (!this.finalSequence) return;
    this.dialogue = [
      "La Place des Lanternes vous accueille. Les vingt-quatre lumières se réveillent.",
      "Debby — Tous ces petits souvenirs… Ils dessinent notre chemin.",
      "Loyal — Et chaque lumière me donne envie d’inventer la suite avec toi. ♥",
      this.finalSequence.message,
    ][this.finalSequence.beat];
    reaction(
      this,
      ["mains", "coeur", "calin", "bisou"][this.finalSequence.beat] as
        "mains" | "coeur" | "calin" | "bisou",
      this.player,
      this.loyal,
    );
    this.emit();
  }
  candidates() {
    const residents = this.npcs.map((n) => ({
      id: `npc:${n.id}`,
      x: n.image.x,
      y: n.image.y,
      name: `Parler à ${n.name}`,
    }));
    if (this.adventDay?.room === this.state.room)
      residents.push({
        id: "advent",
        ...this.adventAnchor(),
        name: `Surprise du jour ${this.adventDay.day}`,
      });
    if (
      this.hunt &&
      this.state.room === "village" &&
      this.hunt.found.length < (this.hunt.step.items?.length ?? 0)
    )
      residents.push({
        id: "advent-hunt",
        ...this.huntPoint(),
        name:
          this.hunt.step.style === "loyal"
            ? "Trouver Loyal"
            : "Recueillir le petit bonheur",
      });
    if (this.state.room !== "village")
      return [
        ...residents,
        {
          id:
            this.state.room === "house"
              ? "letter"
              : this.state.room === "library"
                ? "riddle"
                : this.state.room === "workshop"
                  ? "mini:wrap"
                  : "mini:memory",
          x: 240,
          y: 143,
          name: rooms[this.state.room].object,
        },
        ...(this.state.room === "library"
          ? [
              {
                id: "find:bookmark",
                x: 385,
                y: 139,
                name: "Retrouver le marque-page",
              },
              {
                id: "mini:photo",
                x: 370,
                y: 255,
                name: "Reconstituer la photographie",
              },
            ]
          : this.state.room === "workshop"
            ? [{ id: "find:ribbon", x: 385, y: 139, name: "Prendre le ruban" }]
            : this.state.room === "inn"
              ? [
                  {
                    id: "mini:memory",
                    x: 370,
                    y: 255,
                    name: "Jouer aux cartes",
                  },
                ]
              : []),
        { id: "exit", x: 240, y: 315, name: "Sortir" },
      ];
    return [
      ...residents,
      { id: "loyal", x: this.loyal.x, y: this.loyal.y, name: "Parler à Loyal" },
      ...map.buildings.map((b) => ({
        id: b.id === "loyal_house" ? "enter" : `enter:${b.id}`,
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
          Math.hypot(a.x - this.player.x, a.y - this.player.y) +
          (a.id === "loyal" ? 43 : 0) -
          (Math.hypot(b.x - this.player.x, b.y - this.player.y) +
            (b.id === "loyal" ? 43 : 0)),
      )[0];
  }
  interact() {
    if (this.finalSequence) {
      this.finalSequence.beat++;
      if (this.finalSequence.beat >= 4) {
        this.finalSequence = null;
        this.dialogue = "";
        this.finalCompleted++;
        controls.paused = false;
        this.renderRoom();
        this.emit();
      } else this.finalLine();
      return;
    }
    if (controls.paused) return;
    if (this.dialogue) {
      if (this.activeDialogue) {
        this.selectChoice(0);
        return;
      }
      this.dialogue = "";
      this.emit();
      return;
    }
    const t = this.nearest();
    if (!t) return;
    if (t.id === "advent") {
      this.adventRequested++;
      this.emit();
      return;
    }
    if (t.id === "advent-hunt" && this.hunt) {
      const item = this.hunt.step.items?.[this.hunt.found.length];
      if (item) this.hunt.found.push(item.id);
      if (this.hunt.found.length === (this.hunt.step.items?.length ?? 0))
        this.adventRequested++;
      this.refreshAdvent();
      this.emit();
      return;
    }
    const old = this.state.stage;
    if (t.id === "enter" || t.id.startsWith("enter:") || t.id === "exit") {
      const now = performance.now();
      if (now - this.lastPortalAt < 450) return;
      this.lastPortalAt = now;
      if (t.id === "exit") {
        const building = map.buildings.find(
          (b) => (b.id === "loyal_house" ? "house" : b.id) === this.state.room,
        )!;
        this.state.room = "village";
        this.state.position = {
          x: building.entrance.x * 16,
          y: building.entrance.y * 16 + 20,
        };
      } else {
        this.state.room =
          t.id === "enter" ? "house" : (t.id.slice(6) as Save["room"]);
        this.state.position = { x: 240, y: 280 };
        sendEvent(this.state, { kind: "explore", target: this.state.room });
      }
      this.renderRoom();
      if (this.state.room === "inn")
        reaction(this, "rechauffe", this.player, this.loyal);
    } else if (t.id.startsWith("npc:")) {
      const id = t.id.slice(4) as keyof typeof dialogues;
      sendEvent(this.state, { kind: "talk", target: id });
      this.openDialogue(id, dialogues[id], "greeting");
    } else if (t.id === "riddle") {
      this.openDialogue("riddle", dialogues.riddle, "question");
    } else if (t.id.startsWith("find:")) {
      const item = t.id.slice(5);
      if (!this.state.inventory.includes(item)) this.state.inventory.push(item);
      sendEvent(this.state, { kind: "find", target: item });
      this.dialogue =
        item === "bookmark"
          ? "Un marque-page brodé ! Le livre sur la table semble vous appeler."
          : "Le ruban est retrouvé. Basile — Les commandes t’attendent sur l’établi !";
    } else if (t.id.startsWith("mini:")) {
      this.miniGame = t.id.slice(5) as MiniKind;
      controls.paused = true;
      controls.x = 0;
      controls.y = 0;
    } else if (t.id === "loyal") {
      sendEvent(this.state, { kind: "talk", target: "loyal" });
      this.dialogue =
        this.state.stage === 4
          ? `Loyal — ${this.state.stars.length} étoile${this.state.stars.length > 1 ? "s" : ""}, autant de souvenirs à nous. Célestine, Basile et Madeleine ont encore des histoires à partager. Je reste avec toi. ♥`
          : "Loyal — Debby, chaque étoile sera un souvenir à nous. La première t’attend dans une lettre, sur la table de ma maison au sud-est. Je viens avec toi. ♥";
    } else if (t.id === "letter") {
      sendEvent(this.state, { kind: "find", target: "letter" });
      this.dialogue =
        old >= 2
          ? "« Debby, tu rends même les nuits d’hiver plus douces. Voici notre première étoile. Retrouvons-nous au grand sapin. — Loyal »"
          : "Loyal — Cette lettre t’attend. Parlons d’abord dehors, quand tu voudras.";
    } else if (t.id === "tree") {
      sendEvent(this.state, { kind: "interact", target: "tree" });
      this.dialogue =
        this.state.stage === 4
          ? "Une lumière s’allume. Loyal — Notre premier souvenir, Debby. Et tant d’autres à inventer ensemble. ♥"
          : "Il manque une étoile au sapin. " + objectives[this.state.stage];
    } else if (t.id === "sign")
      this.dialogue =
        "Étoilebois · Maison de Loyal au sud-est. Sapin au centre. Démonstration libre : le vrai calendrier de décembre viendra plus tard.";
    else
      this.dialogue =
        t.id === "gift"
          ? "Un cadeau attend son jour. Aucune surprise future n’est disponible dans cette démo."
          : "Ce lieu ouvrira dans une prochaine phase.";
    this.star?.setVisible(this.state.stage === 4);
    this.refreshAdvent();
    if (t.id === "letter") reaction(this, "lettre", this.player, this.loyal);
    else if (t.id === "tree")
      reaction(
        this,
        this.state.stage === 4 ? "etoile" : "froid",
        this.player,
        this.loyal,
      );
    else if (t.id === "riddle")
      reaction(this, "lecture", this.player, this.loyal);
    else if (t.id === "loyal") reaction(this, "coeur", this.player, this.loyal);
    else if (t.id.startsWith("npc:"))
      reaction(this, "coucou", this.player, this.loyal);
    this.persist(this.state);
    this.emit();
  }
  openDialogue(key: string, graph: DialogueGraph, id: string) {
    this.activeDialogue = { key, graph, id };
    this.state.conversation = { key, node: id };
    const node = graph[id];
    this.dialogue = `${node.speaker} — ${node.text}`;
  }
  selectChoice(index: number) {
    const active = this.activeDialogue;
    if (!active) return;
    const next = choose(this.state, active.graph, active.id, index, active.key);
    if (next) this.openDialogue(active.key, active.graph, next);
    else {
      this.activeDialogue = null;
      this.state.conversation = null;
      this.dialogue = "";
    }
    if (active.key === "riddle")
      reaction(
        this,
        next?.includes("wrong") ? "boude" : "joie",
        this.player,
        this.loyal,
      );
    this.persist(this.state);
    this.emit();
  }
  closeMini() {
    this.miniGame = null;
    controls.paused = false;
    this.emit();
  }
  finishMini(score: number) {
    const kind = this.miniGame;
    if (!kind) return;
    this.state.scores[kind] = Math.min(
      this.state.scores[kind] ?? Infinity,
      score,
    );
    sendEvent(this.state, { kind: "minigame", target: kind });
    this.miniGame = null;
    controls.paused = false;
    this.dialogue =
      "Loyal — Un souvenir de plus ! Retrouvons la personne qui nous a confié cette activité. ♥";
    reaction(this, "joie", this.player, this.loyal);
    this.persist(this.state);
    this.emit();
  }
  emit() {
    const v = {
      save: structuredClone(this.state),
      adventStars: this.adventLights.length,
      dialogue: this.dialogue,
      target: this.target,
      location: roomNames[this.state.room],
      choices: this.activeDialogue
        ? choicesFor(
            this.state,
            this.activeDialogue.graph[this.activeDialogue.id],
          ).map((c) => c.label)
        : [],
      miniGame: this.miniGame,
      period: periodNames[period(this.state.clock)],
      activity: this.npcs
        .map((n) => `${n.name} ${npcActivity(n.id, this.state.clock)}`)
        .join(" · "),
      transitioning: performance.now() - this.lastPortalAt < 450,
      adventRequested: this.adventRequested,
      huntFound: this.hunt?.found ?? [],
      finalCompleted: this.finalCompleted,
      cinematic: !!this.finalSequence,
    };
    const key = JSON.stringify([
      v.save.stage,
      v.save.room,
      v.dialogue,
      v.target,
      v.save.quests,
      v.save.stars,
      v.save.inventory,
      v.choices,
      v.miniGame,
      v.period,
      v.transitioning,
      v.adventRequested,
      v.huntFound,
      v.finalCompleted,
      v.cinematic,
      v.adventStars,
    ]);
    if (key !== this.lastView) {
      this.lastView = key;
      this.publish(v);
    }
  }
  update(_time: number, delta: number) {
    if (!this.player) return;
    // Phaser's smoothed delta can reuse a 60 FPS sample when frames exceed
    // its minimum FPS threshold. Use actual elapsed time for simulation.
    delta = Math.min(this.game.loop.rawDelta, 200);
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
      const before = { x: this.player.x, y: this.player.y };
      this.state.clock = (this.state.clock + Math.min(delta, 200)) % 180000;
      const len = Math.hypot(x, y) || 1,
        speed = movementDistance(delta);
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
        Math.hypot(before.x - this.player.x, before.y - this.player.y) > 0.5 &&
        _time - this.lastFootstep > 320
      ) {
        playSound("step");
        this.lastFootstep = _time;
      }

      if (this.hunt?.step.style !== "loyal") {
        const segment = Math.hypot(
          this.player.x - this.lastTrail.x,
          this.player.y - this.lastTrail.y,
        );
        if (segment >= 4) {
          const origin = { ...this.lastTrail };
          for (let distance = 4; distance <= segment; distance += 4) {
            const point = {
              x: origin.x + ((this.player.x - origin.x) * distance) / segment,
              y: origin.y + ((this.player.y - origin.y) * distance) / segment,
            };
            if (!blocked(point, this.rects, w, h)) this.trail.push(point);
            this.lastTrail = point;
          }
        }
        let budget = speed * 1.2;
        while (this.trail.length > 8 && budget > 0) {
          const target = this.trail[0],
            d = Math.hypot(target.x - this.loyal.x, target.y - this.loyal.y);
          if (d < 1) {
            this.trail.shift();
            continue;
          }
          const distance = Math.min(d, budget);
          const n = move(
            this.loyal,
            ((target.x - this.loyal.x) / d) * distance,
            ((target.y - this.loyal.y) / d) * distance,
            this.rects,
            w,
            h,
          );
          const covered = Math.hypot(n.x - this.loyal.x, n.y - this.loyal.y);
          if (covered < 0.1) {
            this.timer += delta;
            if (this.timer > 1200) {
              this.loyal.setPosition(target.x, target.y);
              this.trail.shift();
              this.timer = 0;
            }
            break;
          }
          this.loyal.setPosition(n.x, n.y);
          budget -= covered;
          this.timer = 0;
          if (Math.hypot(target.x - n.x, target.y - n.y) < 1)
            this.trail.shift();
        }
        if (this.trail.length > 100) this.trail.shift();
      }
    }
    this.player.setDepth(this.player.y);
    animateActor(this.player);
    animateActor(this.loyal);
    if (this.finalSequence) {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        this.tree?.setScale(0.9 + Math.sin(_time / 550) * 0.008);
      this.loyal.setPosition(this.player.x - 26, this.player.y + 5);
      this.adventDecor.forEach((light, i) =>
        light.setAlpha(0.45 + 0.55 * Math.abs(Math.sin(_time / 350 + i))),
      );
      this.star?.setScale(1 + Math.sin(_time / 300) * 0.08);
    }
    for (const npc of this.npcs) {
      const waitingForDebby =
        Math.hypot(npc.image.x - this.player.x, npc.image.y - this.player.y) <
          43 && visible(this.player, npc.image, this.rects);
      if (!controls.paused && !this.dialogue && !waitingForDebby) {
        const target = npc.path[npc.step],
          d = Math.hypot(target.x - npc.image.x, target.y - npc.image.y);
        const night = period(this.state.clock) === 3;
        const speed = Math.min(delta, 200) * (night ? 0.012 : 0.023);
        const n = move(
          npc.image,
          ((target.x - npc.image.x) / Math.max(1, d)) * Math.min(d, speed),
          ((target.y - npc.image.y) / Math.max(1, d)) * Math.min(d, speed),
          this.rects,
          w,
          h,
        );
        npc.image.setPosition(n.x, n.y);
        if (d < 3)
          npc.step =
            (npc.step + (night ? npc.path.length - 1 : 1)) % npc.path.length;
      }
      npc.image.setDepth(npc.image.y);
      animateActor(npc.image);
    }
    const cam = this.cameras.main,
      sx = (cam.width - cam.width / cam.zoom) / 2,
      sy = (cam.height - cam.height / cam.zoom) / 2;
    this.shade
      .setPosition(sx, sy)
      .setSize(cam.width / cam.zoom, cam.height / cam.zoom)
      .setAlpha(
        this.state.room === "village"
          ? [0.1, 0, 0.18, 0.32][period(this.state.clock)]
          : 0.03,
      );
    this.lamps.forEach((lamp, i) =>
      lamp.setAlpha(
        (period(this.state.clock) >= 2 ? 0.28 : 0.1) +
          Math.sin(_time / 600 + i) * 0.035,
      ),
    );
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    for (const { puff, x, y, phase } of this.smoke) {
      const life = (_time / 4200 + phase) % 1;
      puff
        .setPosition(x + Math.sin(life * 4) * 5, y - life * 24)
        .setScale(1 + life)
        .setAlpha(reduced ? 0 : Math.sin(life * Math.PI) * 0.15);
    }
    this.snow.forEach((flake, i) => {
      flake.setVisible(!reduced);
      const span = cam.width / cam.zoom,
        height = cam.height / cam.zoom;
      flake.setPosition(
        sx + ((i * 73 + _time * (0.003 + (i % 3) * 0.001)) % span),
        sy + ((i * 47 + _time * (0.008 + (i % 3) * 0.003)) % height),
      );
    });
    this.loyal.setDepth(this.loyal.y);
    [this.player, this.loyal].forEach((p, i) =>
      this.glasses[i]?.setPosition(p.x, p.y).setDepth(p.y + 0.1),
    );
    this.target = this.dialogue ? "Continuer" : (this.nearest()?.name ?? "");
    // Read-only diagnostics let browser tests observe real movement without
    // changing positions or bypassing gameplay, regardless of rendering speed.
    this.game.canvas.dataset.playerX = String(this.player.x);
    this.game.canvas.dataset.playerY = String(this.player.y);
    this.game.canvas.dataset.loyalX = String(this.loyal.x);
    this.game.canvas.dataset.loyalY = String(this.loyal.y);
    this.game.canvas.dataset.room = this.state.room;
    this.game.canvas.dataset.npcs = JSON.stringify(
      this.npcs.map((n) => ({ id: n.id, x: n.image.x, y: n.image.y })),
    );
    this.emit();
  }
}
