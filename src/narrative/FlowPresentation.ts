import { readGraphics } from "../art/graphics";
import { theatreKeepsake, type TheatreKeepsake } from "./keepsakes";
import { NarrativePerformance } from "./performance";
import Phaser from "phaser";
import type { Village } from "../game/Game";
import { controls } from "../game/Game";
import type { EpisodeProgress, EpisodeScript, ScriptScene } from "./script";
import type { GameEvent } from "../rpg/quests";
import {
  newFlowRuntime,
  residentAnchorAvailable,
  newPuzzle,
  puzzleMove,
  type FlowAction,
  type PuzzleMove,
} from "./flow";
import { flowAnchor } from "./flow-bindings";
import { areaPortals, type ExtraRoom } from "./areas";
import { actor, animateActor } from "../art/actors";
import type { Point, WorldRoom } from "../domain";
import { plaque } from "../art/tags";
import { starFlight } from "./star-flight";
import type { EpisodeContext } from "./context";
type Host = {
  scene: Village;
  script: EpisodeScript;
  context: EpisodeContext;
  progress: () => EpisodeProgress;
  current: () => ScriptScene;
  event: (e: GameEvent) => void;
  dialogue: (block: string, actor?: string | null) => void;
  save: () => void;
  advance: () => void;
  reduced: () => boolean;
  stars: () => number;
  gatherReady: () => boolean;
  moment: (kind: "hands" | "hug" | "glasses") => void;
  walk: (
    id: string,
    sprite: Point & { setPosition?: (x: number, y: number) => unknown },
    target: Point,
    delta: number,
    speed: number,
    room: WorldRoom,
  ) => boolean;
};
/** Data-to-world presentation only; all objectives, choices, checkpoints and rewards use the existing director/reducer/RPC. */
export class FlowPresentation {
  inspection?: { src: string; caption: string };
  dismissInspection() {
    this.inspection = undefined;
    this.host.scene.emit();
  }
  private inspect(action: FlowAction) {
    if (!action.inspect) return;
    const texture = this.host.scene.textures.get(action.inspect);
    if (texture.key === "__MISSING")
      throw Error("Illustration privée manquante");
    const im = texture.getSourceImage() as HTMLImageElement,
      canvas = document.createElement("canvas");
    canvas.width = im.width;
    canvas.height = im.height;
    canvas.getContext("2d")!.drawImage(im, 0, 0);
    this.inspection = {
      src: canvas.toDataURL("image/png"),
      caption: action.label,
    };
  }
  private previousTheatre?: TheatreKeepsake;
  private performanceView?: NarrativePerformance;
  private performanceSave = 0;
  private performanceCamera?: { zoom: number };
  private markers = new Map<string, Phaser.GameObjects.Image>();
  private extras: Phaser.GameObjects.Sprite[] = [];
  private foregrounds: Phaser.GameObjects.Image[] = [];
  private flight?: Phaser.GameObjects.Image;
  private lightRevision = -1;
  private followerSave = 0;
  private followerAnimation?: {
    sprite: Phaser.GameObjects.Sprite;
    key: string;
  };
  presentFollower() {
    const pose = this.followerAnimation;
    if (pose?.sprite.active) {
      // The existing courtesy renderer stops a reserved resident's clip each frame.
      // Sample its original walk frames after that renderer, without new poses or textures.
      const animation = this.host.scene.anims.get(pose.key);
      const frame =
        animation.frames[
          Math.floor((this.host.scene.time.now * animation.frameRate) / 1000) %
            animation.frames.length
        ];
      pose.sprite.anims.stop();
      pose.sprite.setTexture(frame.textureKey, frame.textureFrame);
    }
    this.host.scene.game.canvas.dataset.followerAnimation = pose?.key ?? "";
    this.host.scene.game.canvas.dataset.followerFrame =
      pose?.sprite.frame.name.toString() ?? "";
  }

  private decorations = new Map<string, Phaser.GameObjects.Container>();
  private networkImages = new Map<string, Phaser.GameObjects.Image>();
  private celebration?: {
    count: number;
    elapsed: number;
    lines?: Phaser.GameObjects.Graphics;
  };
  constructor(private host: Host) {
    host.progress().runtime.flow ??= newFlowRuntime();
    this.previousTheatre = host.scene.theatreKeepsake;
  }
  private get p() {
    return this.host.progress();
  }
  private get state() {
    return this.p.runtime.flow!;
  }
  private get current() {
    return this.host.current();
  }
  private get actions() {
    const base =
      this.host.script.scenes[
        Math.min(this.p.sceneIndex, this.host.script.scenes.length - 1)
      ];
    const side = this.host.script.scenes.at(-1)!;
    return [
      ...(base.flow?.actions ?? []),
      ...(side !== base && side.flow?.optional
        ? side.flow.actions.filter(
            (a) =>
              (a.availableAfter ?? this.host.script.scenes.length - 1) <=
              this.p.sceneIndex,
          )
        : []),
    ];
  }
  private scope(action: FlowAction) {
    return this.host.script.scenes.find((s) =>
      s.flow?.actions.includes(action),
    )!;
  }
  get sideScene() {
    return this.state.side
      ? this.host.script.scenes.find((s) => s.id === this.state.side)
      : undefined;
  }
  get busy() {
    return !!this.state.fx || !!this.state.performance;
  }
  private done(action: FlowAction) {
    if (action.replayable) return false;
    const key = `${this.scope(action).id}/${action.id}`;
    return this.p.objectives.includes(key) || this.state.seen.includes(key);
  }
  private enabled(action: FlowAction) {
    if (
      !residentAnchorAvailable(
        action,
        this.host.scene.state.room,
        this.host.scene.npcs.map((n) => n.id),
      )
    )
      return false;
    if (action.when && this.factValue(action.when.fact) !== action.when.value)
      return false;
    if (action.waitForGather && !this.host.gatherReady()) return false;
    const scope = this.scope(action);
    const objective = scope.objectives.find((o) => o.id === action.id);
    return (
      !!objective &&
      (objective.after ?? []).every(
        (id) =>
          this.p.objectives.includes(`${scope.id}/${id}`) ||
          this.state.seen.includes(`${scope.id}/${id}`),
      ) &&
      (!this.p.complete || objective.optional)
    );
  }
  private factValue(key: string) {
    const prefix = `episode-${String(this.host.script.day).padStart(2, "0")}/`;
    if (!key.startsWith(prefix)) return this.host.context.facts[key];
    const f = this.host.script.flow?.facts?.[key.slice(prefix.length)];
    if (!f) return undefined;
    const id = `${f.scene}/${f.choice ?? f.objective}`;
    return f.choice
      ? (this.p.choices[id] ?? this.state.sideChoices[id])
      : this.p.objectives.includes(id) || this.state.seen.includes(id);
  }
  private followerReady(id: string) {
    const f = this.host.script.flow?.follower,
      p = this.state.followers?.[id];
    if (!f || !p || p.room !== f.destination.room) return false;
    const goal = flowAnchor(this.host.scene, f.destination);
    return Math.hypot(p.x - goal.x, p.y - goal.y) < 26;
  }
  get task() {
    const action = this.actions.find((a) => a.id === this.state.active);
    if (!action?.puzzle) return undefined;
    const draft = this.state.drafts[`${this.scope(action).id}/${action.id}`];
    return draft
      ? {
          puzzle: action.puzzle,
          draft,
          assemblyBackdrop:
            action.puzzle.assembly?.backdrops?.[
              this.p.choices[action.puzzle.assembly?.choice ?? ""]
            ],
        }
      : undefined;
  }
  get availableActions() {
    return this.actions
      .filter((a) => this.enabled(a) && !this.done(a))
      .map((a) => a.id);
  }
  candidates() {
    const scene = this.host.scene;
    const targets = this.actions
      .filter(
        (a) =>
          this.enabled(a) &&
          !this.done(a) &&
          (a.anyRoom || a.point.room === scene.state.room),
      )
      .map((a) => ({
        ...flowAnchor(
          scene,
          a.anyRoom ? { ...a.point, room: scene.state.room } : a.point,
        ),
        id: `narrative:flow:${a.id}`,
        name:
          a.label +
          (a.waitForFollower && !this.followerReady(a.waitForFollower)
            ? " (compagnon en chemin)"
            : ""),
        ready: !a.waitForFollower || this.followerReady(a.waitForFollower),
      }));
    for (const id of this.host.script.flow!.portals) {
      if ((areaPortals[id].from ?? "village") !== scene.state.room) continue;
      const access = this.host.script.flow!.portalAccess?.[id];
      if (access && this.p.sceneIndex < access.after) continue;
      const point = scene.living.environments
        .get(scene.state.room)!
        .nearestFree(areaPortals[id].village);
      if (!point) continue;
      targets.push({
        ...point,
        id: `narrative:portal:${id}`,
        name: access?.label ?? "Entrer",
        ready: true,
      });
    }
    return targets;
  }
  interact(id: string) {
    const scene = this.host.scene;
    if (id.startsWith("narrative:portal:")) {
      const area = id.slice("narrative:portal:".length) as ExtraRoom;
      const target = this.candidates().find((t) => t.id === id);
      if (
        !target ||
        Math.hypot(scene.player.x - target.x, scene.player.y - target.y) > 45
      )
        return true;
      scene.state.room = area;
      scene.state.position = { ...areaPortals[area].entry };
      scene.renderRoom();
      this.host.save();
      scene.emit();
      return true;
    }
    if (!id.startsWith("narrative:flow:")) return false;
    const action = this.actions.find(
      (a) => a.id === id.slice("narrative:flow:".length),
    );
    if (!action || !this.enabled(action) || this.done(action)) return true;
    if (action.waitForFollower && !this.followerReady(action.waitForFollower))
      return true;
    this.inspect(action);
    const target = flowAnchor(
      scene,
      action.anyRoom
        ? { ...action.point, room: scene.state.room }
        : action.point,
    );
    if (
      (!action.anyRoom && action.point.room !== scene.state.room) ||
      Math.hypot(target.x - scene.player.x, target.y - scene.player.y) > 45
    )
      return true;
    const scope = this.scope(action);
    const key = `${scope.id}/${action.id}`;
    if (scope.flow?.optional) this.state.side = scope.id;
    if (action.gesture && !this.state.steps[key]) {
      this.state.side = null;
      this.state.steps[key] = 1;
      this.host.save();
      this.markers.get(key)?.setAlpha(0.4);
      return true;
    }
    if (action.performance && (!this.state.steps[key] || action.replayable)) {
      this.state.performance = { action: action.id, elapsed: 0 };
      this.host.save();
      scene.emit();
      return true;
    }
    if (action.puzzle) {
      if (action.replayable && this.state.drafts[key]?.solved)
        this.state.drafts[key] = newPuzzle(action.puzzle);
      this.state.drafts[key] ??= newPuzzle(action.puzzle);
      this.state.active = action.id;
      this.host.save();
      scene.emit();
      return true;
    }
    if (action.dialogue)
      this.host.dialogue(
        action.variants?.find((v) => this.factValue(v.fact) === v.value)
          ?.dialogue ?? action.dialogue,
        ["mira", "noe", "emile", "oscar"].includes(action.actor ?? "")
          ? action.actor
          : null,
      );
    else if (action.effect === "restore") this.startEffect(action);
    else this.completeAction(action);
    return true;
  }
  afterDialogue(block: string) {
    const action = this.actions.find(
      (a) =>
        a.dialogue === block || a.variants?.some((v) => v.dialogue === block),
    );
    if (!action) return false;
    this.inspection = undefined;
    if (action.constellation && action.effect !== "restore") {
      const key = `${this.scope(action).id}/${action.id}`;
      if (!this.state.steps[key]) {
        this.state.steps[key] = 1;
        this.celebration = { count: action.constellation, elapsed: 0 };
      }
    }
    if (this.state.side) {
      const scope = this.scope(action);
      const choice = scope.choices[0];
      const selected =
        choice && this.state.sideChoices[`${scope.id}/${choice.id}`];
      const moment = selected && action.moments?.[selected];
      if (moment) this.host.moment(moment);
      this.completeAction(action);
      return true;
    }
    if (action.effect === "restore") {
      this.startEffect(action);
      return true;
    }
    return false;
  }
  selectSideChoice(id: string, option: string) {
    if (this.sideScene)
      this.state.sideChoices[`${this.sideScene.id}/${id}`] ??= option;
  }
  private completeAction(action: FlowAction) {
    const scope = this.scope(action);
    const key = `${scope.id}/${action.id}`;
    if (scope.flow?.optional) {
      if (!this.state.seen.includes(key)) this.state.seen.push(key);
      this.state.side = null;
      return;
    }
    const goal = scope.objectives.find((o) => o.id === action.id);
    if (goal) this.host.event(goal.event);
  }
  puzzle(move: PuzzleMove | null) {
    const action = this.actions.find((a) => a.id === this.state.active);
    if (!action?.puzzle) return;
    if (!move) {
      this.state.active = null;
      this.state.side = null;
      this.host.save();
      this.host.scene.emit();
      return;
    }
    const key = `${this.scope(action).id}/${action.id}`;
    this.state.drafts[key] = puzzleMove(
      action.puzzle,
      this.state.drafts[key],
      move,
    );
    const solved = this.state.drafts[key].solved;
    if (solved) {
      this.state.active = null;
      this.completeAction(action);
    }
    this.host.save();
    this.host.scene.emit();
  }
  private startEffect(action: FlowAction) {
    if (this.p.runtime.restored) return;
    this.state.fx = { action: action.id, elapsed: 0 };
    this.host.save();
  }
  resume() {
    if (this.state.fx) this.finishEffect();
  }
  private finishEffect() {
    const action = this.actions.find((a) => a.id === this.state.fx?.action);
    if (action?.constellation)
      this.celebration = { count: action.constellation, elapsed: 0 };
    this.state.fx = null;
    this.p.runtime.restored = true;
    this.p.runtime.bookOpened = true;
    this.flight?.destroy();
    this.flight = undefined;
    this.host.event({ kind: "interact", target: "restored-star" });
    this.host.save();
    this.host.scene.refreshAdvent();
    this.host.scene.emit();
  }
  roomRendered() {
    for (const decoration of this.decorations.values())
      if (decoration.active) decoration.destroy();
    this.decorations.clear();
    this.lightRevision = -1;

    this.performanceView?.destroy();
    this.performanceView = undefined;
    for (const marker of this.markers.values())
      if (marker.active) marker.destroy();
    this.markers.clear();
    this.clearExtras();
    const scene = this.host.scene;
    const dialogue = this.p.runtime.dialogue;
    if (dialogue) {
      const action = this.actions.find(
        (a) =>
          a.dialogue === dialogue.block ||
          a.variants?.some((v) => v.dialogue === dialogue.block),
      );
      if (action) this.inspect(action);
    }
    const follower = this.host.script.flow?.follower,
      stored = follower && this.state.followers?.[follower.actor];
    if (
      follower &&
      stored &&
      stored.room === scene.state.room &&
      this.p.sceneIndex >= follower.from &&
      this.p.sceneIndex <= follower.until
    ) {
      const logical = scene.living.get(follower.actor),
        safe =
          scene.living.environments.get(stored.room)?.nearestFree(stored) ??
          stored;
      if (logical) {
        logical.position = { x: safe.x, y: safe.y };
        scene.npcs
          .find((n) => n.id === follower.actor)
          ?.image.setPosition(safe.x, safe.y);
      }
    }
    for (const a of this.host.script.flow?.actors ?? []) {
      const location =
        [...(a.scenePoints ?? [])]
          .reverse()
          .find((p) => p.from <= this.p.sceneIndex)?.point ?? a.point;
      const native = a.appearance === "basile" || a.appearance === "emile";
      if (a.appearance === "basile" && scene.npcs.some((n) => n.id === "oscar"))
        continue;
      if (a.appearance === "emile" && scene.npcs.some((n) => n.id === "emile"))
        continue;
      if (
        location.room !== scene.state.room ||
        (!native && !scene.textures.exists("production-" + a.appearance))
      )
        continue;
      const stored = this.state.followers?.[a.id],
        f = this.host.script.flow?.follower;
      const p =
        stored &&
        f?.actor === a.id &&
        this.p.sceneIndex >= f.from &&
        this.p.sceneIndex <= f.until &&
        stored.room === scene.state.room
          ? stored
          : flowAnchor(scene, location, true);
      const image = native
        ? actor(scene, a.appearance as "basile" | "emile", p.x, p.y)
        : scene.add
            .sprite(p.x, p.y, "production-" + a.appearance, 16)
            .setOrigin(0.5, 0.96)
            .setScale(52 / 224)
            .setDepth(p.y)
            .setName("narrative:actor:" + a.id);
      image.setName("narrative:actor:" + a.id);
      this.extras.push(image);
      if (a.projection && location.room === a.point.room) {
        const fixtures = scene.children.list.filter((child) =>
          child.name.endsWith(":" + a.projection!.fixture),
        ) as Phaser.GameObjects.Image[];
        const fixture = fixtures.sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        )[0];
        if (fixture) {
          // The combined counter sprite includes its rear shelving. Project the
          // torso above the worktop; the cropped front still occludes the legs.
          image.y -= image.displayHeight * 0.45;
          image.setDepth(fixture.depth + 0.1);
          const frame = fixture.frame,
            y = Math.round(frame.height * a.projection.foregroundFrom);
          this.foregrounds.push(
            scene.add
              .image(fixture.x, fixture.y, fixture.texture.key)
              .setOrigin(fixture.originX, fixture.originY)
              .setScale(fixture.scaleX, fixture.scaleY)
              .setCrop(0, y, frame.width, frame.height - y)
              .setDepth(fixture.depth + 0.2)
              .setName("narrative:counter-front:" + a.id),
          );
        }
      }
      scene.actorTags.push({
        actor: image,
        plate: plaque(scene, a.name),
        name: a.name,
      });
    }
  }
  update(delta: number) {
    this.followerAnimation = undefined;
    const scene = this.host.scene;
    const follower = this.host.script.flow?.follower;
    if (
      follower &&
      this.p.sceneIndex >= follower.from &&
      this.p.sceneIndex <= follower.until &&
      this.p.objectives.includes(follower.requires) &&
      !controls.paused &&
      !this.p.runtime.dialogue
    ) {
      const image =
        this.extras.find(
          (s) => s.name === "narrative:actor:" + follower.actor,
        ) ?? scene.npcs.find((n) => n.id === follower.actor)?.image;
      if (image && scene.state.room === follower.destination.room) {
        const destination = flowAnchor(scene, follower.destination),
          nearDestination =
            Math.hypot(
              scene.player.x - destination.x,
              scene.player.y - destination.y,
            ) < 65;
        const distance = Math.hypot(
          scene.player.x - image.x,
          scene.player.y - image.y,
        );
        if (distance < 240 && (nearDestination || distance > 45)) {
          const old = { x: image.x, y: image.y };
          this.host.walk(
            "follower:" + follower.actor,
            scene.living.get(follower.actor)?.position ?? image,
            scene.living.environments.get(scene.state.room)?.nearestFree(
              nearDestination
                ? destination
                : {
                    x:
                      scene.player.x +
                      ((image.x - scene.player.x) * 32) / Math.max(1, distance),
                    y:
                      scene.player.y +
                      ((image.y - scene.player.y) * 32) / Math.max(1, distance),
                  },
              [scene.player],
            ) ?? destination,
            delta,
            48,
            scene.state.room,
          );
          const logical = scene.living.get(follower.actor)?.position;
          if (logical) image.setPosition(logical.x, logical.y);
          if (image.getData("actor")) {
            const dx = image.x - old.x,
              dy = image.y - old.y;
            if (Math.hypot(dx, dy) > 0.08) {
              const direction =
                Math.abs(dx) > Math.abs(dy)
                  ? dx > 0
                    ? "droite"
                    : "gauche"
                  : dy > 0
                    ? "bas"
                    : "haut";
              this.followerAnimation = {
                sprite: image,
                key: `${image.getData("actor")}-${direction}`,
              };
            }
          } else if (
            !this.host.reduced() &&
            Math.hypot(old.x - image.x, old.y - image.y) > 0.1
          ) {
            const dx = image.x - old.x,
              dy = image.y - old.y;
            const row =
              Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 2) : dy > 0 ? 0 : 1;
            image.setFrame(row * 4 + (Math.floor(scene.time.now / 180) % 4));
          }
        }
        image.setDepth(image.y);
        if (!image.getData("actor") && (distance <= 45 || distance >= 240))
          image.setFrame(
            this.host.reduced()
              ? 16
              : 16 + (Math.floor(scene.time.now / 700) % 4),
          );
        this.state.followers ??= {};
        this.state.followers[follower.actor] = {
          room: scene.state.room,
          x: image.x,
          y: image.y,
        };
        this.followerSave += delta;
        if (this.followerSave > 4000) {
          this.followerSave = 0;
          this.host.save();
        }
      }
    }
    if (scene.ambience)
      scene.ambience.storyExterior =
        scene.state.room === "glade" ||
        (this.host.script.flow?.period !== undefined &&
          scene.state.room === "forest");
    const weather = this.host.script.flow?.weather;
    if (scene.ambience)
      scene.ambience.storyStorm =
        !!weather &&
        this.p.sceneIndex >= weather.from &&
        this.p.sceneIndex <= weather.until;
    if (this.celebration) {
      const c = this.celebration;
      c.elapsed += Math.min(200, delta);
      if (scene.tree && this.host.stars() >= c.count && !c.lines) {
        // Measured centers of the first six *existing* atlas stars, not new stars.
        const centers =
          c.count === 12
            ? [
                [129.5, 133.5],
                [65.5, 123],
                [152.5, 120.5],
                [109, 115.5],
                [84.5, 105.5],
                [137.5, 103.5],
              ]
            : [
                [112, 161],
                [74, 152.5],
                [149.5, 153.5],
                [55, 143],
                [168.5, 143],
                [88.5, 138],
              ];
        c.lines = scene.add
          .graphics()
          .setDepth(scene.tree.depth + 1)
          .setName("narrative:constellation");
        c.lines.lineStyle(1, 0xf4da9b, 0.7);
        centers.forEach(([x, y], i) => {
          const px =
              scene.tree!.x +
              (x / 225 - scene.tree!.originX) * scene.tree!.displayWidth,
            py =
              scene.tree!.y +
              (y / 184 - scene.tree!.originY) * scene.tree!.displayHeight;
          if (i) c.lines!.lineTo(px, py);
          else c.lines!.moveTo(px, py);
        });
        c.lines.strokePath();
      }
      if (c.lines)
        c.lines.setAlpha(
          this.host.reduced()
            ? 0.35
            : Math.max(0, Math.sin(Math.min(1, c.elapsed / 3000) * Math.PI)) *
                0.6,
        );
      if (c.elapsed >= 3000) {
        c.lines?.destroy();
        this.celebration = undefined;
      }
    }
    if (this.lightRevision !== this.p.revision) {
      this.lightRevision = this.p.revision;
      for (const area of this.host.script.flow!.portals) {
        const access = this.host.script.flow!.portalAccess?.[area];
        if (!access || this.p.sceneIndex >= access.after)
          scene.narrativeRegions.add(area);
      }
      scene.setTheatreKeepsake(
        theatreKeepsake(this.host.script, this.p, this.host.context),
      );
      for (const [index, path] of (
        this.host.script.flow?.paths ?? []
      ).entries()) {
        const key = "path-" + index;
        if (
          path.room !== scene.state.room ||
          this.p.sceneIndex < path.from ||
          this.decorations.get(key)?.active
        )
          continue;
        const patches: Phaser.GameObjects.Image[] = [];
        path.points.slice(1).forEach((to, i) => {
          const from = path.points[i],
            length = Math.hypot(to.x - from.x, to.y - from.y),
            steps = Math.ceil(length / 24);
          for (let step = 0; step < steps; step++) {
            const t = step / steps;
            patches.push(
              scene.add
                .image(
                  from.x + (to.x - from.x) * t,
                  from.y + (to.y - from.y) * t,
                  "ground-d3-packed-a",
                )
                .setDisplaySize(40, 30)
                .setAlpha(0.6),
            );
          }
        });
        this.decorations.set(
          key,
          scene.add.container(0, 0, patches).setDepth(-94),
        );
      }
      const lights = { ...this.host.context.lights };
      const inheritedTint = Object.values(lights)[0]?.tint ?? 0xffc178;
      for (const n of this.host.script.flow?.network ?? [])
        lights[n.point] = {
          ...(lights[n.point] ?? { tint: inheritedTint }),
          on: !n.requires || this.p.objectives.includes(n.requires),
        };
      if (scene.state.room === "village")
        for (const n of this.host.script.flow?.network ?? []) {
          if (!n.visual) continue; // Existing lantern fixtures already consume the coordinator.
          let image = this.networkImages.get(n.point);
          const p = flowAnchor(
            scene,
            { room: "village", anchor: "world:" + n.point },
            true,
          );
          if (!image?.active) {
            image = scene.add
              .image(p.x + 12, p.y, "production-lantern-off")
              .setOrigin(0.5, 1)
              .setDepth(p.y)
              .setName("narrative:network:" + n.point);
            this.networkImages.set(n.point, image);
          }
          image.setTexture(
            lights[n.point].on
              ? "production-lantern-on"
              : "production-lantern-off",
          );
          image.setScale(28 / image.height);
        }
      const config = this.host.script.flow?.lights;
      if (config) {
        const style = config.styles[this.p.choices[config.choice]] ?? {
          tint: 0xffc178,
        };
        for (const id of config.points)
          lights[id] = {
            on: this.p.objectives.includes(config.requires),
            ...style,
          };
      }
      scene.living.lanterns.configureNarrative(lights);
      for (const item of [
        ...(this.host.context.placements ?? []),
        ...(this.host.script.flow?.placements ?? []),
      ]) {
        const eligible =
          item.point.room === scene.state.room &&
          (!item.requires ||
            this.p.objectives.includes(item.requires) ||
            this.state.seen.includes(item.requires)) &&
          (!item.choice ||
            this.p.choices[item.choice.key] === item.choice.option);
        if (!eligible) {
          this.decorations.get(item.id)?.destroy();
          this.decorations.delete(item.id);
          continue;
        }
        if (this.decorations.get(item.id)?.active) continue;
        if (!scene.textures.exists(item.texture))
          throw Error("Décor narratif requis absent");
        const p = flowAnchor(scene, item.point, true),
          image = scene.add
            .image(0, 0, item.texture)
            .setOrigin(0.5, 1)
            .setFlipY(item.mirror ?? false)
            .setAlpha(item.mirror ? 0.55 : 1);
        image.setScale(item.width / image.width);
        const children: Phaser.GameObjects.GameObject[] = [image];
        if (item.inscription)
          children.push(
            scene.add
              .text(0, -image.displayHeight * 0.32, item.inscription, {
                fontFamily: "serif",
                fontSize: "6px",
                color: "#673b24",
              })
              .setOrigin(0.5),
          );
        if (item.caption)
          children.push(
            scene.add
              .text(0, -image.displayHeight * 0.5, item.caption, {
                fontFamily: "Nunito",
                fontSize: "12px",
                color: "#fff4d3",
                stroke: "#5f4838",
                strokeThickness: 2,
              })
              .setOrigin(0.5),
          );
        this.decorations.set(
          item.id,
          scene.add
            .container(p.x, p.y, children)
            .setDepth(p.y)
            .setName("narrative:decoration:" + item.id),
        );
      }
    }
    const period = this.host.script.flow?.period;
    if (
      period !== undefined &&
      this.p.sceneIndex >= (this.host.script.flow?.periodFrom ?? 0) &&
      !controls.paused &&
      !document.hidden
    ) {
      this.state.previousClock ??= scene.state.clock;
      scene.state.clock =
        period * 45000 + Math.min(35000, scene.state.clock % 45000);
    }
    if (this.state.performance) {
      if (controls.paused || document.hidden || this.p.runtime.dialogue) return;
      const current = this.state.performance;
      const action = this.actions.find((a) => a.id === current.action);
      if (!action?.performance) throw Error("Spectacle sans action déclarée");
      const config = action.performance;
      current.elapsed = Math.min(
        config.duration,
        current.elapsed + Math.min(200, delta),
      );
      if (!this.performanceCamera && (config.origin || config.destination)) {
        const camera = scene.cameras.main,
          focus = flowAnchor(scene, config.destination ?? config.origin!, true);
        this.performanceCamera = { zoom: camera.zoom };
        const focal = {
          x: focus.x,
          y: focus.y - (config.destination ? 20 : 60),
        };
        const center = {
          x: (scene.player.x + focal.x) / 2,
          y: (scene.player.y + focal.y) / 2,
        };
        const zoom = Math.min(
          camera.zoom,
          camera.width / (Math.abs(focal.x - scene.player.x) + 220),
        );
        camera.stopFollow();
        camera.pan(center.x, center.y, this.host.reduced() ? 0 : 250);
        camera.zoomTo(Math.max(0.9, zoom), this.host.reduced() ? 0 : 250);
      }
      this.performanceView ??= new NarrativePerformance(scene);
      this.performanceView.update(
        config,
        current.elapsed,
        flowAnchor(scene, action.point),
        this.host.reduced(),
        config.destination ? flowAnchor(scene, config.destination) : undefined,
      );
      scene.theatrePresentation?.update(
        current.elapsed,
        config.kind !== "fireflies",
        this.host.reduced() || readGraphics() === "none",
      );
      scene.game.canvas.dataset.performance = JSON.stringify({
        kind: config.kind,
        elapsed: current.elapsed,
        duration: config.duration,
      });
      this.performanceSave += delta;
      if (this.performanceSave > 2000) {
        this.performanceSave = 0;
        this.host.save();
      }
      if (current.elapsed >= config.duration) {
        this.state.performance = null;
        this.state.steps[`${this.scope(action).id}/${action.id}`] = 1;
        this.restorePerformanceCamera();
        this.performanceView.destroy();
        this.performanceView = undefined;
        delete scene.game.canvas.dataset.performance;
        if (action.dialogue)
          this.host.dialogue(action.dialogue, action.actor ?? null);
        else this.completeAction(action);
        this.host.save();
        scene.emit();
      }
      return;
    }
    if (
      (controls.paused && !this.state.fx) ||
      this.host.progress().runtime.dialogue ||
      document.hidden
    )
      return;
    for (const image of this.extras)
      if (image.active && !this.host.reduced())
        if (image.getData("actor")) animateActor(image);
        else if (
          !follower ||
          image.name !== "narrative:actor:" + follower.actor ||
          this.p.sceneIndex < follower.from ||
          this.p.sceneIndex > follower.until
        )
          image.setFrame(16 + (Math.floor(scene.time.now / 700) % 4));
    if (this.state.fx) {
      this.state.fx.elapsed += Math.min(200, delta);
      const action = this.actions.find((a) => a.id === this.state.fx?.action);
      if (action) {
        const from = flowAnchor(scene, action.point),
          to = scene.tree
            ? {
                x: scene.tree.x,
                y: scene.tree.y - scene.tree.displayHeight * 0.6,
              }
            : { x: from.x + 20, y: from.y - 140 };
        if (!this.flight)
          this.flight = scene.add
            .image(from.x, from.y - 40, "quest_star")
            .setScale(0.45)
            .setDepth(5000);
        const t = Math.min(
          1,
          this.state.fx.elapsed / (this.host.reduced() ? 400 : 2400),
        );
        const p = starFlight({ x: from.x, y: from.y - 40 }, to, t, 55);
        this.flight.setPosition(p.x, p.y);
      }
      if (this.state.fx.elapsed >= (this.host.reduced() ? 400 : 2400))
        this.finishEffect();
      return;
    }
    const visible = new Set<string>();
    for (const action of this.actions) {
      const key = `${this.scope(action).id}/${action.id}`;
      if (
        action.point.room !== scene.state.room ||
        !this.enabled(action) ||
        this.done(action) ||
        !action.icon
      )
        continue;
      visible.add(key);
      let image = this.markers.get(key);
      const p = flowAnchor(scene, action.point);
      if (!image?.active) {
        const texture = "production-" + action.icon;
        if (!scene.textures.exists(texture))
          throw Error("Ressource narrative requise absente");
        image = scene.add
          .image(p.x, p.y - 10, texture)
          .setDepth(p.y + 1)
          .setName("narrative:item:" + action.id);
        image.setScale((action.icon === "stone" ? 30 : 20) / image.width);
        this.markers.set(key, image);
      }
    }
    for (const [id, image] of this.markers)
      if (!visible.has(id)) {
        image.destroy();
        this.markers.delete(id);
      }
    this.host.advance();
  }
  private restorePerformanceCamera() {
    if (!this.performanceCamera) return;
    const scene = this.host.scene;
    scene.cameras.main.zoomTo(
      this.performanceCamera.zoom,
      this.host.reduced() ? 0 : 250,
    );
    scene.cameras.main.startFollow(
      scene.player,
      true,
      this.host.reduced() ? 1 : 0.12,
      this.host.reduced() ? 1 : 0.12,
    );
    this.performanceCamera = undefined;
  }
  stop() {
    this.restorePerformanceCamera();
    this.inspection = undefined;
    this.performanceView?.destroy();
    if (
      this.host.scene.narrative?.view.preview ||
      this.host.scene.narrative?.view.replay
    )
      this.host.scene.setTheatreKeepsake(this.previousTheatre);
    delete this.host.scene.game.canvas.dataset.performance;
    if (this.state.previousClock !== undefined)
      this.host.scene.state.clock = this.state.previousClock;
    delete this.host.scene.game.canvas.dataset.followerAnimation;
    delete this.host.scene.game.canvas.dataset.followerFrame;
    for (const image of this.networkImages.values()) image.destroy();
    this.networkImages.clear();
    if (this.host.scene.ambience) {
      this.host.scene.ambience.storyStorm = false;
      this.host.scene.ambience.storyExterior =
        this.host.scene.state.room === "glade";
    }
    for (const decoration of this.decorations.values()) decoration.destroy();
    this.celebration?.lines?.destroy();
    if (
      this.host.scene.narrative?.view.preview ||
      this.host.scene.narrative?.view.replay
    ) {
      this.host.scene.narrativeRegions = new Set(
        this.host.context.regions ?? [],
      );
      this.host.scene.living.lanterns.configureNarrative(
        this.host.context.lights ?? {},
      );
    }
    for (const m of this.markers.values()) m.destroy();
    this.clearExtras();
    this.flight?.destroy();
    this.markers.clear();
    for (const m of this.host.script.flow?.media ?? [])
      if (this.host.scene.textures.exists(m.key))
        this.host.scene.textures.remove(m.key);
  }
  private clearExtras() {
    for (const image of this.foregrounds) if (image.active) image.destroy();
    this.foregrounds = [];
    const owned = new Set(this.extras);
    for (const tag of this.host.scene.actorTags)
      if (owned.has(tag.actor)) {
        tag.plate.destroy();
      }
    this.host.scene.actorTags = this.host.scene.actorTags.filter(
      (tag) => !owned.has(tag.actor),
    );
    for (const actor of this.extras) if (actor.active) actor.destroy();
    this.extras = [];
  }
}
