import Phaser from "phaser";
import type { Village } from "../game/Game";
import { controls } from "../game/Game";
import type { EpisodeProgress, EpisodeScript, ScriptScene } from "./script";
import type { GameEvent } from "../rpg/quests";
import {
  newFlowRuntime,
  newPuzzle,
  puzzleMove,
  type FlowAction,
  type PuzzleMove,
} from "./flow";
import { flowAnchor } from "./flow-bindings";
import { areaPortals } from "./areas";
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
};
/** Data-to-world presentation only; all objectives, choices, checkpoints and rewards use the existing director/reducer/RPC. */
export class FlowPresentation {
  private markers = new Map<string, Phaser.GameObjects.Image>();
  private extras: Phaser.GameObjects.Sprite[] = [];
  private foregrounds: Phaser.GameObjects.Image[] = [];
  private flight?: Phaser.GameObjects.Image;
  private lightRevision = -1;
  private decorations = new Map<string, Phaser.GameObjects.Container>();
  private celebration?: {
    count: number;
    elapsed: number;
    lines?: Phaser.GameObjects.Graphics;
  };
  constructor(private host: Host) {
    host.progress().runtime.flow ??= newFlowRuntime();
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
    return !!this.state.fx;
  }
  private done(action: FlowAction) {
    if (action.replayable) return false;
    const key = `${this.scope(action).id}/${action.id}`;
    return this.p.objectives.includes(key) || this.state.seen.includes(key);
  }
  private enabled(action: FlowAction) {
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
  get task() {
    const action = this.actions.find((a) => a.id === this.state.active);
    if (!action?.puzzle) return undefined;
    const draft = this.state.drafts[`${this.scope(action).id}/${action.id}`];
    return draft ? { puzzle: action.puzzle, draft } : undefined;
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
        name: a.label,
      }));
    if (scene.state.room === "village")
      for (const id of this.host.script.flow!.portals) {
        const access = this.host.script.flow!.portalAccess?.[id];
        if (access && this.p.sceneIndex < access.after) continue;
        const point = scene.living.environments
          .get("village")!
          .nearestFree(areaPortals[id].village);
        if (!point) continue;
        targets.push({
          ...point,
          id: `narrative:portal:${id}`,
          name: access?.label ?? "Entrer",
        });
      }
    return targets;
  }
  interact(id: string) {
    const scene = this.host.scene;
    if (id.startsWith("narrative:portal:")) {
      const area = id.slice("narrative:portal:".length) as "forest" | "bakery";
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
        action.dialogue,
        ["mira", "noe", "emile"].includes(action.actor ?? "")
          ? action.actor
          : null,
      );
    else if (action.effect === "restore") this.startEffect(action);
    else this.completeAction(action);
    return true;
  }
  afterDialogue(block: string) {
    const action = this.actions.find((a) => a.dialogue === block);
    if (!action) return false;
    if (this.state.side) {
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
      this.state.sideChoices[`${this.sideScene.id}/${id}`] = option;
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
    for (const marker of this.markers.values())
      if (marker.active) marker.destroy();
    this.markers.clear();
    this.clearExtras();
    const scene = this.host.scene;
    for (const a of this.host.script.flow?.actors ?? []) {
      const location =
        [...(a.scenePoints ?? [])]
          .reverse()
          .find((p) => p.from <= this.p.sceneIndex)?.point ?? a.point;
      if (
        location.room !== scene.state.room ||
        !scene.textures.exists("production-" + a.appearance)
      )
        continue;
      const p = flowAnchor(scene, location, true);
      const image = scene.add
        .sprite(p.x, p.y, "production-" + a.appearance, 16)
        .setOrigin(0.5, 0.96)
        .setScale(52 / 224)
        .setDepth(p.y)
        .setName("narrative:actor:" + a.id);
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
    const scene = this.host.scene;
    if (this.celebration) {
      const c = this.celebration;
      c.elapsed += Math.min(200, delta);
      if (scene.tree && this.host.stars() >= c.count && !c.lines) {
        // Measured centers of the first six *existing* atlas stars, not new stars.
        const centers = [
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
      const lights = { ...this.host.context.lights };
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
      for (const item of this.host.script.flow?.placements ?? []) {
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
          image = scene.add.image(0, 0, item.texture).setOrigin(0.5, 1);
        image.setScale(item.width / image.width);
        const children: Phaser.GameObjects.GameObject[] = [image];
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
    if (
      (controls.paused && !this.state.fx) ||
      this.host.progress().runtime.dialogue ||
      document.hidden
    )
      return;
    for (const image of this.extras)
      if (image.active && !this.host.reduced())
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
  stop() {
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
