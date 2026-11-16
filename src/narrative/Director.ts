import Phaser from "phaser";
import { controls, type Village } from "../game/Game";
import { actor, animateActor } from "../art/actors";
import { plaque } from "../art/tags";
import { reaction } from "../art/reactions";
import { anchors, plan, villageMap } from "../art/village34";
import { roomDimensions, interiorCollisions } from "../art/rooms33";
import { decorationRects } from "../decor/model";
import { readGraphics } from "../art/graphics";
import { move, type Point } from "../domain";
import type { GameEvent } from "../rpg/quests";
import {
  finishScene,
  receiveEvent,
  selectNarrativeChoice,
  restoreProgress,
} from "./engine";
import {
  validateRuntime,
  type EpisodeScript,
  type EpisodeProgress,
} from "./script";
import type { NarrativeBridge, NarrativeView } from "./bridge";

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const canonical: Record<string, string> = {
  emile: "emile",
  noe: "augustin",
  mira: "celestine",
};
const names: Record<string, string> = {
  emile: "Émile",
  noe: "Augustin",
  mira: "Célestine",
};
type Persist = (p: EpisodeProgress) => Promise<void>;

/** Optional presentation adapter. All narrative words are authorized runtime data. */
export class NarrativeDirector implements NarrativeBridge {
  progress: EpisodeProgress;
  private queue = Promise.resolve();
  private pending = 0;
  private error = "";
  private disposed = false;
  private autosave = 0;
  private bookRequest = 0;
  private paths = new Map<
    string,
    { goal: Point; points: Point[]; retry: number }
  >();
  private marker?: Phaser.GameObjects.Image;
  private flocon?: Phaser.GameObjects.Sprite;
  private lastPlayer?: Phaser.GameObjects.Sprite;
  private effects: Phaser.GameObjects.Image[] = [];
  private particlesStarted = false;
  private originalProfile;
  private oldDialogue;
  private zoom: number;
  private bench: Point & { top: number } = {
    x: anchors.hunts[2].x,
    y: anchors.hunts[2].y,
    top: anchors.hunts[2].y - 40,
  };
  private windowHouse = plan.houses.reduce((best, h) =>
    distance(h, anchors.hunts[1]) < distance(best, anchors.hunts[1]) ? h : best,
  );
  constructor(
    readonly scene: Village,
    readonly script: EpisodeScript,
    progress: EpisodeProgress,
    readonly preview: boolean,
    private persist: Persist,
    private restoredBefore = 0,
    private alreadyRestored = false,
  ) {
    this.progress = restoreProgress(script, progress) as EpisodeProgress;
    validateRuntime(this.progress.runtime);
    this.originalProfile = scene.living.get("mira")!.profile;
    this.oldDialogue = { active: scene.activeDialogue, line: scene.dialogue };
    this.zoom = scene.cameras.main.zoom;
    scene.activeDialogue = null;
    scene.dialogue = "";
    scene.clearHunt();
    scene.narrative = this;
    const escort = this.progress.runtime.escort,
      mira = scene.living.get("mira")!;
    if (escort) {
      mira.profile = { ...this.originalProfile, room: escort.room };
      mira.position = { ...escort.position };
      mira.intent = null;
      mira.reaction = null;
      scene.syncNarrativeResidents();
    }
    this.roomRendered();
    // Never replay an already-started effect after reload. Its outcome is stable.
    if (this.progress.runtime.cinematic) {
      const kind = this.progress.runtime.cinematic.kind;
      this.progress.runtime.cinematic = null;
      if (kind === "scatter") {
        this.progress.runtime.dispersed = true;
        this.beginDialogue("scatter");
      } else {
        this.progress.runtime.restored = true;
        this.event({ kind: "interact", target: "restored-star" });
      }
      this.checkpoint();
    }
    scene.refreshAdvent();
    scene.emit();
  }
  private get current() {
    return this.script.scenes[
      Math.min(this.progress.sceneIndex, this.script.scenes.length - 1)
    ];
  }
  private get runtime() {
    return this.progress.runtime;
  }
  private get reduced() {
    return (
      readGraphics() === "none" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }
  get dialogueActive() {
    return !!this.runtime.dialogue;
  }
  get choices() {
    const beat = this.beat();
    return beat?.choiceId
      ? (this.current.choices
          .find((c) => c.id === beat.choiceId)
          ?.options.map((o) => o.label) ?? [])
      : [];
  }
  get talkingActor() {
    return this.runtime.dialogue?.actor ?? null;
  }
  get reservedActors(): ReadonlySet<string> {
    return new Set(this.runtime.escort ? ["mira"] : []);
  }
  get busy() {
    return !!this.runtime.cinematic;
  }
  get ownCompanion() {
    return true;
  }
  get treeFrame() {
    if (this.runtime.cinematic?.kind === "scatter") {
      const elapsed = this.runtime.cinematic.elapsed;
      return elapsed < 14000
        ? 24
        : Math.max(0, 24 - Math.floor((elapsed - 14000) / 250));
    }
    return this.runtime.restored ? 1 : this.runtime.dispersed ? 0 : 24;
  }
  get view(): NarrativeView {
    const meeting = this.script.scenes.find((s) => s.kind === "meet");
    const met = Object.keys(canonical).filter((id) =>
      this.progress.objectives.includes(`${meeting?.id}/${id}`),
    );
    return {
      episodeId: this.progress.episodeId,
      title: this.script.title,
      sceneId: this.current.id,
      objective: this.progress.complete
        ? "Exploration libre"
        : this.current.prompt,
      revision: this.progress.revision,
      complete: this.progress.complete,
      restored: Math.min(
        24,
        this.restoredBefore +
          (this.runtime.restored && !this.alreadyRestored ? 1 : 0),
      ),
      preview: this.preview,
      hintLevel: Math.min(3, Math.floor(this.runtime.hintMs / 30000)),
      saving: this.pending > 0,
      error: this.error,
      book: this.runtime.restored ? this.script.book : null,
      bookRequest: this.bookRequest,
      chosenReplies: this.script.scenes.flatMap((s) =>
        s.choices.flatMap((c) =>
          c.options
            .filter((o) => this.progress.choices[`${s.id}/${c.id}`] === o.id)
            .map((o) => o.label),
        ),
      ),
      characters: met.map((id) => names[id]),
      places: [...this.runtime.visited],
    };
  }
  private beat() {
    const d = this.runtime.dialogue;
    return d ? this.current.dialogues[d.block]?.[d.beat] : undefined;
  }
  private checkpoint() {
    if (this.disposed) return;
    this.progress.revision++;
    const snapshot = structuredClone(this.progress);
    this.pending++;
    this.queue = this.queue
      .then(async () => {
        if (this.error) return;
        await this.persist(snapshot);
      })
      .catch((e) => {
        this.error = e instanceof Error ? e.message : "Sauvegarde indisponible";
      })
      .finally(() => {
        this.pending--;
        this.scene.emit();
      });
    this.scene.emit();
  }
  async flush() {
    await this.queue;
    if (this.error) throw Error(this.error);
  }
  retry() {
    this.error = "";
    this.checkpoint();
  }
  private event(event: GameEvent) {
    const next = receiveEvent(
      this.script,
      this.progress,
      event,
    ) as EpisodeProgress;
    if (next.revision !== this.progress.revision) {
      this.progress = next;
      this.checkpoint();
    }
    this.advance();
  }
  private advance() {
    if (
      this.progress.complete ||
      this.dialogueActive ||
      this.busy ||
      this.error
    )
      return;
    try {
      const next = finishScene(this.script, this.progress, {
        world: this.scene.state,
        completedDays: [],
      }) as EpisodeProgress;
      if (next.sceneIndex === this.progress.sceneIndex) return;
      this.progress = next;
      this.paths.clear();
      this.marker?.destroy();
      this.marker = undefined;
      if (this.current.kind === "tree" && !this.runtime.escort)
        this.startEscort();
      this.checkpoint();
      this.scene.refreshAdvent();
    } catch {
      /* Unsatisfied objectives are an ordinary exploration state. */
    }
  }
  private beginDialogue(block: string, actorId: string | null = null) {
    if (!this.current.dialogues[block] || this.dialogueActive || this.error)
      return;
    this.runtime.dialogue = { block, beat: 0, actor: actorId };
    if (!this.runtime.firstMetVillager && actorId && canonical[actorId])
      this.runtime.firstMetVillager = canonical[actorId];
    this.renderDialogue();
    this.checkpoint();
  }
  private renderDialogue() {
    const beat = this.beat();
    if (beat) this.scene.dialogue = `${beat.speaker} — ${beat.text}`;
  }
  choose(index: number) {
    if (!this.runtime.dialogue || this.error) return;
    const beat = this.beat();
    if (!beat) return;
    if (beat.choiceId) {
      const option = this.current.choices.find((c) => c.id === beat.choiceId)
        ?.options[index];
      if (!option) return;
      this.progress = selectNarrativeChoice(
        this.script,
        this.progress,
        beat.choiceId,
        option.id,
        { world: this.scene.state, completedDays: [] },
      ) as EpisodeProgress;
      if (option.id === "quiet")
        reaction(this.scene, "mains", this.scene.player, this.scene.loyal);
    }
    const d = this.runtime.dialogue!;
    d.beat++;
    if (d.beat < this.current.dialogues[d.block].length) this.renderDialogue();
    else {
      const block = d.block,
        event = this.current.dialogueEvents[block],
        kind = this.current.kind;
      this.runtime.dialogue = null;
      this.scene.dialogue = "";
      if (kind === "trail") {
        this.runtime.clueIndex++;
        this.runtime.hintMs = 0;
        this.marker?.destroy();
        this.marker = undefined;
      }
      this.event(event);
      if (kind === "restore" && !this.runtime.restored)
        this.startEffect("restore");
      if (kind === "scatter" && this.runtime.escort)
        this.runtime.escort.phase = "return";
    }
    this.checkpoint();
    this.scene.emit();
  }
  private safe(p: Point) {
    return (
      this.scene.living.environments
        .get(this.scene.state.room)
        ?.nearestFree(p) ?? p
    );
  }
  private get entry() {
    return this.safe({ x: 1012, y: 1224 });
  }
  private get center() {
    return this.safe({ ...anchors.advent });
  }
  private get windowPoint() {
    return this.safe({
      x: this.windowHouse.door.x,
      y: this.windowHouse.door.y + 18,
    });
  }
  private get lampPoint() {
    return this.safe({ x: 1036, y: 844 });
  }
  private get cluePoint() {
    return [this.safe(anchors.hunts[0]), this.windowPoint, this.lampPoint][
      Math.min(2, this.runtime.clueIndex)
    ];
  }
  candidates() {
    if (this.error || this.busy || this.dialogueActive) return [];
    const village = this.scene.state.room === "village",
      candidates: (Point & { id: string; name: string })[] = [];
    if (village && !this.progress.complete) {
      if (this.current.kind === "arrival") {
        if (
          distance(this.scene.loyal, this.entry) < 65 &&
          this.flocon &&
          distance(this.flocon, this.scene.loyal) < 65
        )
          candidates.push({
            ...this.entry,
            id: "narrative:welcome",
            name: "Retrouver Loyal et Flocon",
          });
      } else if (this.current.kind === "meet" || this.current.kind === "tree")
        candidates.push({
          ...this.center,
          id: "narrative:tree",
          name: this.current.title,
        });
      else if (this.current.kind === "trail")
        candidates.push({
          ...this.cluePoint,
          id: "narrative:clue",
          name: `Examiner l’indice ${this.runtime.clueIndex + 1}`,
        });
      else if (this.current.kind === "restore")
        candidates.push({
          ...this.safe(this.bench),
          id: "narrative:star",
          name: this.current.title,
        });
    }
    if (this.scene.state.room === "house" && this.runtime.restored)
      candidates.push({
        ...this.safe({ x: 720, y: 488 }),
        id: "narrative:book",
        name: "Ouvrir le Livre des Étoiles",
      });
    if (
      this.scene.state.room === "house" &&
      this.current.kind === "home" &&
      !this.progress.objectives.includes(`${this.current.id}/home`)
    )
      candidates.push({
        x: this.scene.loyal.x,
        y: this.scene.loyal.y,
        id: "narrative:home",
        name: "Parler à Loyal",
      });
    if (this.flocon && distance(this.scene.player, this.flocon) < 28)
      candidates.push({
        x: this.flocon.x,
        y: this.flocon.y,
        id: "narrative:fox",
        name: "Caresser Flocon",
      });
    return candidates;
  }
  interact(id: string) {
    if (this.error || this.busy) return id.startsWith("narrative:");
    if (id === "narrative:fox") {
      reaction(this.scene, "coeur", this.scene.player, this.flocon!);
      return true;
    }
    if (id === "narrative:book") {
      this.openBook();
      return true;
    }
    if (id === "narrative:home") {
      this.beginDialogue("home");
      return true;
    }
    if (id === "narrative:welcome") {
      this.beginDialogue("welcome");
      return true;
    }
    if (id.startsWith("npc:") && this.current.kind === "meet") {
      const actorId = id.slice(4);
      if (
        this.current.dialogues[actorId] &&
        !this.progress.objectives.includes(`${this.current.id}/${actorId}`)
      ) {
        this.beginDialogue(actorId, actorId);
        return true;
      }
    }
    if (id === "narrative:tree") {
      if (this.current.kind === "meet")
        this.event({ kind: "explore", target: "central-square" });
      else this.beginDialogue("tree");
      return true;
    }
    if (id === "narrative:clue") {
      this.beginDialogue(`clue-${this.runtime.clueIndex + 1}`);
      return true;
    }
    if (id === "narrative:star") {
      this.beginDialogue("star");
      return true;
    }
    if (id === "loyal") {
      if (
        this.current.kind === "home" &&
        this.scene.state.room === "house" &&
        !this.progress.objectives.includes(`${this.current.id}/home`)
      )
        this.beginDialogue("home");
      else reaction(this.scene, "coeur", this.scene.player, this.scene.loyal);
      return true;
    }
    return false;
  }
  openBook() {
    if (!this.runtime.restored) return;
    this.bookRequest++;
    if (
      this.current.kind === "home" &&
      this.scene.state.room === "house" &&
      this.progress.objectives.includes(`${this.current.id}/home`)
    ) {
      this.runtime.bookOpened = true;
      this.event({ kind: "interact", target: "book-at-home" });
    }
    this.scene.emit();
  }
  private walk(
    id: string,
    sprite: Point & { setPosition?: (x: number, y: number) => unknown },
    target: Point,
    delta: number,
    speed: number,
    room = this.scene.state.room,
  ) {
    const nav = this.scene.living.environments.get(room);
    if (!nav) return false;
    const goal = nav.nearestFree(target);
    if (!goal) return false;
    if (distance(sprite, goal) < 3) return true;
    const old = this.paths.get(id);
    if (old) old.retry -= delta;
    if (
      !old ||
      (distance(old.goal, goal) > 16 && old.retry <= 0) ||
      !old.points.length
    ) {
      const path = nav.findPath(sprite, goal);
      if (!path) return false;
      this.paths.set(id, { goal, points: path, retry: 500 });
    }
    const route = this.paths.get(id)!;
    let budget = (speed * Math.min(delta, 200)) / 1000;
    while (budget > 0 && route.points.length) {
      const point = route.points[0],
        length = distance(sprite, point);
      if (length < 1) {
        route.points.shift();
        continue;
      }
      const amount = Math.min(length, budget);
      const next = move(
        sprite,
        ((point.x - sprite.x) / length) * amount,
        ((point.y - sprite.y) / length) * amount,
        nav.rects,
        nav.width,
        nav.height,
      );
      if (
        room === this.scene.state.room &&
        id !== "loyal" &&
        distance(next, this.scene.player) < 18
      )
        break;
      if (distance(sprite, next) < 0.01) {
        this.paths.delete(id);
        break;
      }
      if (sprite.setPosition) sprite.setPosition(next.x, next.y);
      else {
        sprite.x = next.x;
        sprite.y = next.y;
      }
      budget -= amount;
    }
    return distance(sprite, goal) < 4;
  }
  private startEffect(kind: "scatter" | "restore") {
    this.runtime.cinematic = { kind, elapsed: 0 };
    if (kind === "scatter") this.runtime.dispersalStarted = true;
    this.scene.cameras.main.stopFollow();
    const tree = this.scene.tree;
    if (tree) {
      this.scene.cameras.main.setZoom(
        Math.max(
          0.7,
          Math.min(
            this.zoom,
            this.scene.scale.height / (tree.displayHeight + 100),
          ),
        ),
      );
      this.scene.cameras.main.pan(
        tree.x,
        tree.y - tree.displayHeight / 2,
        this.reduced ? 0 : 500,
      );
    }
    this.particlesStarted = false;
    this.checkpoint();
  }
  private effect(delta: number) {
    const c = this.runtime.cinematic!;
    c.elapsed += delta;
    const length = this.reduced ? 2500 : c.kind === "scatter" ? 30000 : 6500;
    const normalized = c.elapsed / length;
    if (
      !this.reduced &&
      !this.particlesStarted &&
      normalized > (c.kind === "scatter" ? 0.46 : 0.1) &&
      this.scene.state.room === "village"
    ) {
      this.particlesStarted = true;
      const total = c.kind === "scatter" ? 24 : 1;
      for (let i = 0; i < total; i++) {
        const theta = i * 2.39996,
          tree = this.scene.tree!,
          origin =
            c.kind === "scatter"
              ? {
                  x: tree.x + Math.sin(theta) * (25 + i * 2),
                  y: tree.y - 40 - i * 5,
                }
              : { x: this.bench.x, y: this.bench.top };
        const image = this.scene.add
          .image(origin.x, origin.y, "quest_star")
          .setScale(0.45)
          .setDepth(5000);
        this.effects.push(image);
        this.scene.tweens.add({
          targets: image,
          x: c.kind === "scatter" ? origin.x + Math.cos(theta) * 240 : tree.x,
          y:
            c.kind === "scatter"
              ? origin.y - 140 - i * 5
              : tree.y - tree.displayHeight / 2,
          alpha: c.kind === "scatter" ? 0 : 1,
          duration: c.kind === "scatter" ? 2500 : 1800,
          onComplete: () => image.destroy(),
        });
      }
    }
    if (this.scene.tree)
      this.scene.tree.setFrame(
        "sapin_" +
          String(
            c.kind === "scatter"
              ? normalized < 0.46
                ? 24
                : Math.max(0, 24 - Math.floor(((normalized - 0.46) / 0.2) * 24))
              : normalized > 0.6
                ? 1
                : 0,
          ).padStart(2, "0"),
      );
    if (c.elapsed < length) return;
    const kind = c.kind;
    this.runtime.cinematic = null;
    this.effects.forEach((i) => i.destroy());
    this.effects = [];
    this.scene.cameras.main
      .setZoom(this.zoom)
      .startFollow(this.scene.player, true, 1, 1);
    if (kind === "scatter") {
      this.runtime.dispersed = true;
      this.beginDialogue("scatter");
    } else {
      this.runtime.restored = true;
      this.event({ kind: "interact", target: "restored-star" });
    }
    this.scene.refreshAdvent();
    this.checkpoint();
  }
  private startEscort() {
    this.ensureLibrary();
    const mira = this.scene.living.get("mira")!;
    this.scene.living.reservations.release("mira");
    mira.intent = null;
    mira.reaction = null;
    this.runtime.escort = {
      room: "library",
      position: { ...mira.position },
      phase: "out",
    };
  }
  private escort(delta: number) {
    const escort = this.runtime.escort;
    if (!escort) return;
    this.ensureLibrary();
    const mira = this.scene.living.get("mira")!,
      building = villageMap.buildings.find((b) => b.id === "library")!;
    const door = {
      x: building.entrance.x * 16,
      y: building.entrance.y * 16 + 20,
    };
    let target: Point;
    if (escort.phase === "out") target = { x: 240, y: 316 };
    else if (escort.phase === "place") target = { x: 1015, y: 795 };
    else if (escort.phase === "return") target = door;
    else target = { x: 240, y: 280 };
    const arrived = this.walk(
      "mira",
      mira.position,
      target,
      delta,
      38,
      escort.room,
    );
    escort.position = { ...mira.position };
    if (!arrived) return;
    if (escort.phase === "out") {
      escort.phase = "place";
      escort.room = "village";
      mira.profile = { ...this.originalProfile, room: "village" };
      mira.position = { ...door };
      escort.position = { ...door };
      this.paths.delete("mira");
      this.scene.syncNarrativeResidents();
    } else if (escort.phase === "return") {
      escort.phase = "inside";
      escort.room = "library";
      mira.profile = { ...this.originalProfile };
      mira.position = { x: 240, y: 316 };
      escort.position = { ...mira.position };
      this.paths.delete("mira");
      this.scene.syncNarrativeResidents();
    } else if (escort.phase === "inside") {
      this.runtime.escort = null;
      mira.profile = this.originalProfile;
      mira.phase = -1;
      mira.intent = null;
      mira.state = "IDLE";
      mira.previousState = null;
      mira.queued = true;
      this.paths.delete("mira");
      this.checkpoint();
    }
  }
  private ensureLibrary() {
    if (!this.scene.living.environments.has("library")) {
      const { width, height } = roomDimensions("library");
      this.scene.living.attach("library", width, height, [
        ...interiorCollisions("library"),
        ...decorationRects("library"),
      ]);
    }
  }
  roomRendered() {
    this.lastPlayer = this.scene.player;
    this.paths.clear();
    this.marker = undefined;
    this.flocon = this.scene.children.getByName("flocon") as
      Phaser.GameObjects.Sprite | undefined;
    if (!this.flocon) {
      const p = this.safe({ x: 240, y: 310 });
      this.flocon = actor(this.scene, "flocon", p.x, p.y);
      this.scene.actorTags.push({
        actor: this.flocon,
        plate: plaque(this.scene, "Flocon"),
        name: "Flocon",
      });
    }
    if (this.scene.state.room === "village") {
      const benches = this.scene.children.list.filter((o) => {
        const image = o as Phaser.GameObjects.Image;
        return (
          (image.texture?.key.includes("bench") ||
            image.name?.includes("bench")) &&
          image.x !== undefined
        );
      }) as Phaser.GameObjects.Image[];
      const bench = benches.sort(
        (a, b) => distance(a, anchors.hunts[2]) - distance(b, anchors.hunts[2]),
      )[0];
      if (bench)
        this.bench = {
          ...this.safe({ x: bench.x, y: bench.y + 24 }),
          top: bench.y - bench.displayHeight - 8,
        };
    }
    this.renderDialogue();
  }
  update(delta: number) {
    if (this.disposed || document.hidden || this.error) return;
    if (this.lastPlayer !== this.scene.player) this.roomRendered();
    if (controls.paused && !this.busy) return;
    if (this.scene.dialogue && !this.dialogueActive) return;
    const r = this.runtime,
      kind = this.current.kind,
      village = this.scene.state.room === "village";
    if (!r.visited.includes(this.scene.state.room)) {
      r.visited.push(this.scene.state.room);
      this.checkpoint();
    }
    this.escort(delta);
    if (this.busy) this.effect(delta);
    else {
      if (!r.origin) {
        r.origin = { ...this.scene.state.position };
        this.checkpoint();
      }
      if (kind === "arrival" && distance(r.origin, this.scene.player) > 10)
        this.event({ kind: "explore", target: "first-walk" });
      if (
        kind === "meet" &&
        village &&
        distance(this.scene.player, this.center) < 100
      )
        this.event({ kind: "explore", target: "central-square" });
      if (kind === "scatter" && !r.dispersalStarted && !this.dialogueActive)
        this.startEffect("scatter");
      if (kind === "trail" && !this.dialogueActive) r.hintMs += delta;
      const loyalTarget =
        kind === "arrival" && village && !this.dialogueActive
          ? { x: this.entry.x - 40, y: this.entry.y }
          : { x: this.scene.player.x - 30, y: this.scene.player.y + 10 };
      if (distance(this.scene.loyal, loyalTarget) > 12)
        this.walk("loyal", this.scene.loyal, loyalTarget, delta, 120);
      if (this.flocon) {
        const target =
          kind === "trail" && r.hintMs >= 30000 && village
            ? this.cluePoint
            : { x: this.scene.loyal.x - 25, y: this.scene.loyal.y + 20 };
        if (
          distance(this.flocon, target) > 20 &&
          distance(this.flocon, this.scene.player) > 45
        )
          this.walk("flocon", this.flocon, target, delta, 135);
        this.flocon.setDepth(this.flocon.y);
        animateActor(this.flocon);
      }
    }
    if (
      village &&
      !this.dialogueActive &&
      !this.busy &&
      !this.progress.complete &&
      ["trail", "restore"].includes(kind)
    ) {
      if (!this.marker?.scene)
        this.marker = this.scene.add
          .image(0, 0, "quest_star")
          .setScale(kind === "restore" ? 0.7 : 0.25)
          .setDepth(5000);
      const p =
        kind === "restore"
          ? { x: this.bench.x, y: this.bench.top }
          : this.cluePoint;
      this.marker
        .setPosition(p.x, p.y - (kind === "trail" ? 5 : 0))
        .setAlpha(
          this.reduced
            ? 0.85
            : 0.75 + Math.sin(this.scene.time.now / 700) * 0.1,
        );
    } else if (this.marker?.scene) this.marker.setVisible(false);
    if (
      this.marker?.scene &&
      village &&
      !this.progress.complete &&
      ["trail", "restore"].includes(kind) &&
      !this.dialogueActive &&
      !this.busy
    )
      this.marker.setVisible(true);
    this.renderDialogue();
    if (this.scene.tree && !this.busy)
      this.scene.tree.setFrame(
        "sapin_" + String(this.treeFrame).padStart(2, "0"),
      );
    this.autosave += delta;
    if (this.autosave >= 5000 && (kind === "trail" || this.busy || r.escort)) {
      this.autosave = 0;
      this.checkpoint();
    }
    this.advance();
    this.scene.game.canvas.dataset.narrative = JSON.stringify({
      ...this.view,
      book: !!this.view.book,
      runtime: r,
      sceneIndex: this.progress.sceneIndex,
      objectives: this.progress.objectives,
      choices: this.progress.choices,
      targets: this.candidates(),
      actors: {
        loyal: { x: this.scene.loyal.x, y: this.scene.loyal.y },
        flocon: this.flocon ? { x: this.flocon.x, y: this.flocon.y } : null,
        entry: this.entry,
      },
      treeFrame: this.scene.tree?.frame.name ?? null,
    });
  }
  stop() {
    if (this.disposed) return;
    this.disposed = true;
    this.effects.forEach((i) => i.destroy());
    this.marker?.destroy();
    if (this.scene.narrative === this) this.scene.narrative = undefined;
    const mira = this.scene.living.get("mira")!;
    if (this.runtime.escort) {
      mira.profile = this.originalProfile;
      if (this.runtime.escort.room !== this.originalProfile.room)
        mira.position = { x: 240, y: 316 };
      mira.phase = -1;
      mira.intent = null;
      mira.queued = true;
      mira.previousState = null;
      mira.state = "IDLE";
    }
    if (this.dialogueActive) this.scene.dialogue = this.oldDialogue.line;
    if (!this.scene.activeDialogue)
      this.scene.activeDialogue = this.oldDialogue.active;
    this.scene.syncNarrativeResidents();
    this.scene.cameras.main
      .setZoom(this.zoom)
      .startFollow(this.scene.player, true, 1, 1);
    delete this.scene.game.canvas.dataset.narrative;
    this.scene.refreshAdvent();
    this.scene.emit();
  }
}
