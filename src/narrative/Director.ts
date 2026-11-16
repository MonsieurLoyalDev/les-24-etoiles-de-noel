import Phaser from "phaser";
import { emptyEpisodeContext, type EpisodeContext } from "./context";
import { controls, type Village } from "../game/Game";
import { actor, animateActor, actorKeys, type Actor } from "../art/actors";
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
import {
  presentation,
  phaseOf,
  activeHintTime,
  hintLevel,
} from "./orchestration";
import { dayOneBindings as bindings } from "./bindings";
import { playSceneAudio } from "./sound";
import { clearReaction } from "../art/reactions";
import { prepareNarrativeCues } from "./cues";
import { dialogueGraph, advancePrivateDialogue } from "./dialogue-adapter";
import { choicesFor, type DialogueGraph } from "../rpg/dialogue";
import { DayOnePolish, type Gesture } from "./polish";
import { starFlight } from "./star-flight";
import { FlowPresentation } from "./FlowPresentation";
import { flowAnchor } from "./flow-bindings";
import type { PuzzleMove } from "./flow";

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
  private cameraReturning = false;
  private originalProfile;
  private oldDialogue;
  private zoom: number;
  private hintLine = "";
  private cue = "";
  private glimmers: Phaser.GameObjects.Image[] = [];
  private graphs = new Map<string, DialogueGraph>();
  private momentUntil = 0;
  private momentStart: Point | null = null;
  private polish: DayOnePolish;
  private restingBench?: Phaser.GameObjects.Image;
  private flow?: FlowPresentation;
  private pose = () => {
    if (this.flow && !controls.paused && !this.dialogueActive && !this.busy)
      for (const npc of this.scene.npcs)
        if (this.paths.get(npc.id)?.points.length) animateActor(npc.image);
    if (
      this.scene.time.now > this.momentUntil ||
      !this.momentStart ||
      distance(this.scene.player, this.momentStart) > 3 ||
      this.dialogueActive ||
      this.busy
    )
      return;
    this.face(this.scene.player, this.scene.loyal);
    this.face(this.scene.loyal, this.scene.player);
  };
  private confirmedRestored = false;
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
    private authority: "server" | "preview" = "preview",
    readonly replay = false,
    private clearIntent: () => Promise<void> = async () => {},
    readonly context: EpisodeContext = emptyEpisodeContext(),
  ) {
    this.polish = new DayOnePolish(scene);
    this.confirmedRestored = alreadyRestored;
    this.progress = restoreProgress(script, progress) as EpisodeProgress;
    validateRuntime(this.progress.runtime);
    scene.living.lanterns.configureNarrative(context.lights ?? {});
    scene.narrativeRegions = new Set(context.regions ?? []);
    if (script.flow)
      this.flow = new FlowPresentation({
        scene,
        script,
        context,
        progress: () => this.progress,
        current: () => this.current,
        event: (e) => this.event(e),
        dialogue: (block, actor) => this.beginDialogue(block, actor),
        save: () => this.checkpoint(),
        advance: () => this.advance(),
        reduced: () => this.reduced,
        stars: () => this.view.restored,
        gatherReady: () => this.gatherReady(),
      });
    this.originalProfile = scene.living.get("mira")!.profile;
    this.oldDialogue = { active: scene.activeDialogue, line: scene.dialogue };
    this.zoom = scene.cameras.main.zoom;
    scene.activeDialogue = null;
    scene.dialogue = "";
    scene.clearHunt();
    scene.narrative = this;
    scene.events.on("postupdate", this.pose);
    const savedLocation = presentation(this.progress).location;
    if (savedLocation) {
      scene.state.room = savedLocation.room;
      scene.state.position = { ...savedLocation.position };
      scene.renderRoom();
      const loyal = this.safe(savedLocation.loyal);
      scene.loyal.setPosition(loyal.x, loyal.y);
      if (savedLocation.flocon && this.flocon) {
        const fox = this.safe(savedLocation.flocon);
        this.flocon.setPosition(fox.x, fox.y);
      }
    }
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
    const stage = presentation(this.progress);
    if (!stage.introSeen && this.current.kind === "arrival") {
      if (scene.state.room !== "village") {
        scene.state.room = "village";
        scene.renderRoom();
      }
      const entry = this.entry;
      scene.player.setPosition(entry.x, entry.y);
      scene.state.position = { ...entry };
      scene.loyal.setPosition(entry.x - 36, entry.y - 4);
      this.flocon?.setPosition(entry.x - 58, entry.y + 18);
      stage.introSeen = true;
      stage.introRemaining = this.reduced ? 300 : 2400;
      scene.cameras.main.fadeIn(this.reduced ? 0 : 600);
      this.progress.runtime.origin = { ...entry };
      this.checkpoint();
    } else stage.introRemaining = 0;
    // Never replay an already-started effect after reload. Its outcome is stable.
    if (this.progress.runtime.cinematic) {
      const kind = this.progress.runtime.cinematic.kind;
      this.progress.runtime.cinematic = null;
      if (kind === "scatter") {
        this.progress.runtime.dispersed = true;
        if (this.scatterReady()) this.beginDialogue("scatter");
      } else {
        this.progress.runtime.restored = true;
        this.event({ kind: "interact", target: "restored-star" });
      }
      this.checkpoint();
    }
    scene.refreshAdvent();
    this.flow?.resume();
    scene.emit();
  }
  private get current() {
    if (this.flow?.sideScene) return this.flow.sideScene;
    return this.script.scenes[
      Math.min(this.progress.sceneIndex, this.script.scenes.length - 1)
    ];
  }
  private scatterReady() {
    const escort = this.runtime.escort;
    return (
      this.scene.state.room === "village" &&
      distance(this.scene.player, this.center) < 160 &&
      (!escort ||
        (escort.room === "village" &&
          distance(escort.position, {
            x: this.center.x + 55,
            y: this.center.y + 20,
          }) < 40))
    );
  }
  private face(sprite: Phaser.GameObjects.Sprite, target: Point) {
    const name = sprite.getData("actor") as Actor;
    if (!name || !actorKeys[name]) return;
    const dx = target.x - sprite.x,
      dy = target.y - sprite.y;
    const direction =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "droite"
          : "gauche"
        : dy > 0
          ? "bas"
          : "haut";
    const texture = actorKeys[name],
      frame = this.scene.textures
        .get(texture)
        .getFrameNames()
        .find((f) => f.includes(`_${direction}_01`));
    if (frame) sprite.stop().setTexture(texture, frame).setFlipX(false);
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
    return !!this.runtime.dialogue || !!this.hintLine;
  }
  get choices() {
    const beat = this.beat();
    const d = this.runtime.dialogue;
    return beat?.choiceId && d
      ? choicesFor(this.scene.state, this.graph(d.block)[`beat-${d.beat}`]).map(
          (c) => c.label,
        )
      : [];
  }
  get talkingActor() {
    return this.runtime.dialogue?.actor ?? null;
  }
  get reservedActors(): ReadonlySet<string> {
    const ids = this.runtime.escort ? ["mira"] : [];
    const gather = this.script.flow?.gather;
    if (
      gather &&
      this.progress.sceneIndex >= gather.from &&
      this.progress.sceneIndex <= gather.until
    )
      ids.push(...gather.actors);
    for (const action of this.current.flow?.actions ?? [])
      if (action.actor) ids.push(action.actor);
    if (this.busy)
      for (const n of this.scene.npcs)
        if (distance(n.image, this.scene.player) < 350) ids.push(n.id);
    return new Set(ids);
  }
  get busy() {
    return (
      !!this.runtime.cinematic ||
      presentation(this.progress).introRemaining > 0 ||
      !!this.flow?.busy
    );
  }
  get ownCompanion() {
    return true;
  }
  get treeFrame() {
    if (this.flow || this.progress.complete) return this.view.restored;
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
        : this.current.prompt +
          (this.flow
            ? ` · ${this.current.objectives.filter((o) => !o.optional && this.progress.objectives.includes(`${this.current.id}/${o.id}`)).length}/${this.current.objectives.filter((o) => !o.optional).length}`
            : ""),
      revision: this.progress.revision,
      complete: this.progress.complete,
      restored: Math.min(
        24,
        this.restoredBefore +
          ((this.authority === "server"
            ? this.confirmedRestored
            : this.runtime.restored) && !this.alreadyRestored
            ? 1
            : 0),
      ),
      preview: this.preview,
      replay: this.replay,
      hintLevel: hintLevel(this.runtime.hintMs),
      saving: this.pending > 0,
      error: this.error,
      book: this.runtime.restored
        ? this.script.book
        : (this.context.pages.at(-1) ?? null),
      bookPages: [
        ...this.context.pages,
        ...(this.runtime.restored
          ? [
              { day: this.script.day, ...this.script.book },
              ...(this.script.flow?.bookExtras ?? [])
                .filter(
                  (page) =>
                    !page.requires ||
                    this.progress.objectives.includes(page.requires) ||
                    this.runtime.flow?.seen.includes(page.requires),
                )
                .map((page) => ({
                  day: this.script.day,
                  title: page.title,
                  text: page.text,
                })),
            ]
          : []),
      ],
      bookRequest: this.bookRequest,
      phase: phaseOf(this.progress, this.current.kind),
      completedAt: presentation(this.progress).completedAt,
      actions: this.actions(),
      audioCue: this.cue,
      task: this.flow?.task,
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
  private graph(block: string) {
    const key = `${this.current.id}/${block}`;
    if (!this.graphs.has(key))
      this.graphs.set(key, dialogueGraph(this.current, block));
    return this.graphs.get(key)!;
  }
  acknowledge(receipt: { restored: boolean; completedAt: string | null }) {
    this.confirmedRestored = receipt.restored;
    if (receipt.completedAt)
      presentation(this.progress).completedAt = receipt.completedAt;
    this.scene.emit();
  }
  private actions() {
    if (this.busy || this.dialogueActive || this.error) return [];
    const p = presentation(this.progress),
      near = distance(this.scene.player, this.scene.loyal) < 80;
    if (this.flow)
      return near
        ? [
            { id: "hands", label: "Prendre la main de Loyal" },
            { id: "hug", label: "Faire un câlin à Loyal" },
            { id: "glasses", label: "Ajuster nos lunettes" },
          ]
        : [];
    const actions: { id: string; label: string }[] = [];
    if (
      near &&
      (p.moment === "tree" ||
        this.current.kind === "home" ||
        (this.current.kind === "arrival" &&
          this.progress.objectives.some((id) => id.endsWith("/welcome"))))
    )
      actions.push(
        { id: "hands", label: "Prendre la main de Loyal" },
        { id: "hug", label: "Faire un câlin à Loyal" },
        { id: "glasses", label: "Ajuster nos lunettes" },
        {
          id: "admire",
          label:
            p.moment === "tree"
              ? "Admirer le sapin ensemble"
              : "Profiter du moment",
        },
      );
    if (p.moment === "tree")
      actions.push({ id: "continue", label: "Poursuivre l’aventure" });
    if (p.moment === "invitation")
      actions.push(
        { id: "continue", label: "Rejoindre le chalet" },
        { id: "explore", label: "Continuer à explorer" },
      );
    for (const target of this.candidates())
      if (
        target.id.startsWith("narrative:optional:") &&
        distance(target, this.scene.player) < 43
      )
        actions.push({
          id: target.id.slice("narrative:optional:".length),
          label: target.name,
        });
    return actions;
  }
  private optional(id: string) {
    const p = presentation(this.progress);
    if (id === "continue" || id === "explore") {
      p.moment = null;
      this.advance();
    } else {
      if (!p.optional.includes(id)) p.optional.push(id);
      if (id === "hands" || id === "hug" || id === "glasses")
        this.companionMoment(id);
      else if (id === "bench" && this.restingBench)
        this.polish.start(
          "sit",
          this.scene.player,
          this.scene.loyal,
          this.restingBench,
        );
      else if (id === "fox" && this.flocon)
        reaction(this.scene, "coeur", this.scene.player, this.flocon);
      else if (id === "admire")
        this.scene.cameras.main.pan(
          bindings.square.x,
          bindings.square.y - 50,
          this.reduced ? 0 : 500,
        );
      else
        this.scene.dialogue = `Étoilebois — ${({ window: "Une vitrine de pâtisseries, à observer tranquillement.", lantern: "La lumière chaude accompagne les pas dans la neige.", bench: "Une pause près du banc, aux côtés de Loyal.", fire: "Le feu du foyer invite à prendre son temps.", rest: "Le salon reste un endroit pour se reposer ensemble." } as Record<string, string>)[id] ?? "Un petit moment à partager."}`;
    }
    this.checkpoint();
    this.scene.emit();
  }
  private companionMoment(kind?: Gesture) {
    clearReaction(this.scene);
    this.momentUntil = this.scene.time.now + (this.reduced ? 300 : 1600);
    this.momentStart = { x: this.scene.player.x, y: this.scene.player.y };
    this.face(this.scene.player, this.scene.loyal);
    this.face(this.scene.loyal, this.scene.player);
    if (kind) this.polish.start(kind, this.scene.player, this.scene.loyal);
  }
  private checkpoint() {
    if (this.disposed) return;
    presentation(this.progress).location = {
      room: this.scene.state.room,
      position: { x: this.scene.player.x, y: this.scene.player.y },
      loyal: { x: this.scene.loyal.x, y: this.scene.loyal.y },
      flocon: this.flocon ? { x: this.flocon.x, y: this.flocon.y } : null,
    };
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
    if (
      this.current.objectives.some(
        (o) =>
          o.event.kind === event.kind &&
          o.event.target === event.target &&
          this.progress.objectives.includes(`${this.current.id}/${o.id}`),
      )
    ) {
      this.advance();
      return;
    }
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
      this.error ||
      presentation(this.progress).moment
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
    clearReaction(this.scene);
    this.runtime.dialogue = { block, beat: 0, actor: actorId };
    if (!this.runtime.firstMetVillager && actorId && canonical[actorId])
      this.runtime.firstMetVillager = canonical[actorId];
    this.renderDialogue();
    this.checkpoint();
  }
  private renderDialogue() {
    if (this.hintLine) {
      this.scene.dialogue = this.hintLine;
      return;
    }
    const beat = this.beat();
    if (beat) this.scene.dialogue = `${beat.speaker} — ${beat.text}`;
  }
  choose(index: number) {
    if (this.hintLine) {
      this.hintLine = "";
      this.scene.dialogue = "";
      this.scene.emit();
      return;
    }
    if (!this.runtime.dialogue || this.error) return;
    const beat = this.beat();
    if (!beat) return;
    const cursor = this.runtime.dialogue,
      graph = this.graph(cursor.block),
      node = `beat-${cursor.beat}`;
    const selected = choicesFor(this.scene.state, graph[node])[index];
    if (!selected) return;
    if (beat.choiceId) {
      const option = this.current.choices.find((c) => c.id === beat.choiceId)
        ?.options[graph[node].choices.indexOf(selected)];
      if (!option) return;
      if (this.flow?.sideScene)
        this.flow.selectSideChoice(beat.choiceId, option.id);
      else
        this.progress = selectNarrativeChoice(
          this.script,
          this.progress,
          beat.choiceId,
          option.id,
          { world: this.scene.state, completedDays: [] },
        ) as EpisodeProgress;
      if (option.id === "quiet") this.companionMoment();
    }
    const d = this.runtime.dialogue!;
    const next = advancePrivateDialogue(this.scene.state, graph, node, index);
    if (next) {
      d.beat = Number(next.slice("beat-".length));
      this.renderDialogue();
    } else {
      const block = d.block,
        event = this.current.dialogueEvents[block],
        kind = this.current.kind;
      this.runtime.dialogue = null;
      this.scene.dialogue = "";
      const sideHandled = this.flow?.afterDialogue(block);
      if (kind === "trail") {
        this.runtime.clueIndex++;
        this.runtime.hintMs = 0;
        presentation(this.progress).hintSpoken = 0;
        this.marker?.destroy();
        this.marker = undefined;
      }
      if (kind === "tree") presentation(this.progress).moment = "tree";
      if (kind === "arrival")
        this.runtime.origin = { ...this.scene.state.position };
      if (!sideHandled) this.event(event);
      if (!this.flow && kind === "restore" && !this.runtime.restored)
        this.startEffect("restore");
      if (kind === "scatter" && this.runtime.escort)
        this.runtime.escort.phase =
          this.runtime.escort.room === "library" ? "inside" : "return";
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
    return this.safe(bindings.arrival);
  }
  private get center() {
    return this.safe(bindings.square);
  }
  private get windowPoint() {
    return this.safe({
      x: this.windowHouse.door.x,
      y: this.windowHouse.door.y + 18,
    });
  }
  private get lampPoint() {
    return this.safe(bindings.lantern.position);
  }
  private get cluePoint() {
    return [this.safe(bindings.snow), this.windowPoint, this.lampPoint][
      Math.min(2, this.runtime.clueIndex)
    ];
  }
  candidates() {
    if (this.flow)
      return this.busy || this.dialogueActive || this.error
        ? []
        : this.flow.candidates();
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
      else if (this.current.kind === "restore" && !this.runtime.restored)
        candidates.push({
          ...this.safe(this.bench),
          id: "narrative:star",
          name: this.current.title,
        });
    }
    if (this.scene.state.room === "house" && this.runtime.restored)
      candidates.push({
        ...this.safe(bindings.houseBook),
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
    if (village && this.current.kind === "meet") {
      const inn = plan.buildings.find((b) => b.id === "inn")!;
      candidates.push({
        ...this.safe(inn.returnPoint),
        id: "narrative:optional:window",
        name: "Observer la vitrine",
      });
      candidates.push({
        ...this.lampPoint,
        id: "narrative:optional:lantern",
        name: "Observer les lanternes",
      });
      candidates.push({
        ...this.safe(
          this.restingBench
            ? {
                x: this.restingBench.x,
                y: this.restingBench.getBounds().bottom + 12,
              }
            : this.bench,
        ),
        id: "narrative:optional:bench",
        name: "Faire une pause avec Loyal",
      });
    }
    if (this.scene.state.room === "house") {
      candidates.push({
        ...this.safe(bindings.houseHearth),
        id: "narrative:optional:fire",
        name: "Observer le feu",
      });
      candidates.push({
        ...this.safe(bindings.houseRest),
        id: "narrative:optional:rest",
        name: "Se reposer près du canapé",
      });
    }
    return candidates;
  }
  interact(id: string) {
    if (this.error || this.busy) return id.startsWith("narrative:");
    if (this.flow?.interact(id)) return true;
    if (id.startsWith("narrative:optional:")) {
      const name = id.slice("narrative:optional:".length);
      const target = this.candidates().find((c) => c.id === id);
      if (
        this.actions().some((a) => a.id === name) ||
        (target && distance(target, this.scene.player) < 43)
      )
        this.optional(name);
      return true;
    }
    if (id === "narrative:fox") {
      this.optional("fox");
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
    if (!this.runtime.restored && !this.context.pages.length) return;
    this.bookRequest++;
    if (
      this.current.kind === "home" &&
      this.scene.state.room === "house" &&
      this.progress.objectives.includes(`${this.current.id}/home`)
    ) {
      this.runtime.bookOpened = true;
      this.event({ kind: "interact", target: "book-at-home" });
      if (this.progress.complete) {
        presentation(this.progress).completedAt ??=
          this.authority === "preview" ? new Date().toISOString() : null;
        this.checkpoint();
      }
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
      const path = nav.findPath(
        sprite,
        goal,
        id !== "loyal" && room === this.scene.state.room
          ? [this.scene.player]
          : [],
      );
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
      ) {
        this.paths.delete(id);
        break;
      }
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
    this.cameraReturning = false;
    this.runtime.cinematic = { kind, elapsed: 0 };
    if (kind === "scatter") this.runtime.dispersalStarted = true;
    clearReaction(this.scene);
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
    if (this.flocon)
      this.polish.fox(this.flocon, delta, "discovery", this.reduced);
    if (c.kind === "scatter" && this.scene.tree) {
      const tree = this.scene.tree;
      if (!this.glimmers.length) {
        for (let i = 0; i < 25; i++)
          this.glimmers.push(
            this.scene.add
              .image(0, 0, "quest_star")
              .setScale(i === 24 ? 0.09 : 0.12)
              .setDepth(4999)
              .setAlpha(0),
          );
      }
      this.glimmers.forEach((image, i) => {
        if (i === 24 && this.flocon) {
          image
            .setPosition(
              this.flocon.x,
              this.flocon.y - this.flocon.displayHeight * 0.8,
            )
            .setAlpha(
              normalized < 0.13
                ? this.reduced
                  ? 0.35
                  : 0.3 + Math.sin(normalized * 30) * 0.2
                : 0,
            );
        } else {
          const row = Math.floor(i / 4),
            t = i % 4;
          image
            .setPosition(
              tree.x + (t - 1.5) * (16 + row * 4),
              tree.y -
                tree.displayHeight * 0.83 +
                row * tree.displayHeight * 0.1,
            )
            .setAlpha(
              normalized > 0.13 + i * 0.006 && normalized < 0.46
                ? this.reduced
                  ? 0.25
                  : 0.45
                : 0,
            );
        }
      });
      if (normalized < 0.13 && this.flocon) this.face(this.flocon, tree);
      if (normalized > 0.83 && !this.cameraReturning) {
        this.cameraReturning = true;
        this.scene.cameras.main.pan(
          this.scene.player.x,
          this.scene.player.y,
          this.reduced ? 0 : 450,
        );
      }
    }
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
        const destination = {
          x: c.kind === "scatter" ? origin.x + Math.cos(theta) * 240 : tree.x,
          y:
            c.kind === "scatter"
              ? origin.y - 140 - i * 5
              : tree.y - tree.displayHeight / 2,
        };
        const scatter = c.kind === "scatter";
        this.scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: c.kind === "scatter" ? 2500 : 1800,
          ease: "Sine.easeInOut",
          onUpdate: (tween) => {
            if (!image.active) return;
            const t = tween.getValue() ?? 0;
            const point = starFlight(
              origin,
              destination,
              t,
              scatter ? Math.sin(theta) * 65 : 55,
            );
            image
              .setPosition(point.x, point.y)
              .setAlpha(scatter ? 1 - t : 1)
              .setScale(scatter ? 0.45 : 0.45 - Math.sin(Math.PI * t) * 0.08);
          },
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
    this.glimmers.forEach((i) => i.destroy());
    this.glimmers = [];
    this.scene.cameras.main.zoomTo(this.zoom, this.reduced ? 0 : 350);
    this.scene.cameras.main.startFollow(
      this.scene.player,
      true,
      this.reduced ? 1 : 0.12,
      this.reduced ? 1 : 0.12,
    );
    if (kind === "scatter") {
      this.runtime.dispersed = true;
      if (this.scatterReady()) this.beginDialogue("scatter");
    } else {
      this.runtime.restored = true;
      presentation(this.progress).moment = "invitation";
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
    if (escort.phase === "out") target = bindings.libraryDoor;
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
      mira.position = { ...bindings.libraryDoor };
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
    this.polish.clear();
    this.restingBench = this.scene.children.list
      .filter((o) => {
        const im = o as Phaser.GameObjects.Image;
        return (
          im.active && im.visible && /^d35-bench-/.test(im.texture?.key ?? "")
        );
      })
      .map((o) => o as Phaser.GameObjects.Image)
      .sort(
        (a, b) =>
          distance(
            a,
            plan.buildings.find((building) => building.id === "loyal_house")!
              .returnPoint,
          ) -
          distance(
            b,
            plan.buildings.find((building) => building.id === "loyal_house")!
              .returnPoint,
          ),
      )[0];
    prepareNarrativeCues(this.scene);
    this.lastPlayer = this.scene.player;
    this.paths.clear();
    this.marker = undefined;
    this.glimmers = [];
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
    if (
      this.scene.state.room === "house" &&
      !this.scene.children.getByName("narrative:fox-rest")
    ) {
      const image = this.scene.add
        .image(bindings.foxCushion.x, bindings.foxCushion.y, "d31-rug-oval")
        .setDepth(-88)
        .setName("narrative:fox-rest");
      image.setScale(40 / image.width);
    }
    this.renderDialogue();
    this.flow?.roomRendered();
  }
  puzzle(move: PuzzleMove | null) {
    this.flow?.puzzle(move);
  }
  private updateFlow(delta: number) {
    if (this.disposed || document.hidden) return;
    if (this.error) {
      this.scene.game.canvas.dataset.narrative = JSON.stringify({
        ...this.view,
        runtime: this.runtime,
        sceneIndex: this.progress.sceneIndex,
        objectives: this.progress.objectives,
        choices: this.progress.choices,
      });
      return;
    }
    if (this.lastPlayer !== this.scene.player) this.roomRendered();
    if (!controls.paused && !this.dialogueActive && !this.busy) {
      const gather = this.script.flow?.gather;
      if (
        gather &&
        this.progress.sceneIndex >= gather.from &&
        this.progress.sceneIndex <= gather.until
      ) {
        if (gather.actors.includes("mira") && !this.runtime.escort)
          this.startEscort();
        for (const [i, id] of gather.actors
          .filter((id) => id !== "mira")
          .entries()) {
          const resident = this.scene.living.get(id);
          if (resident) {
            const target = gather.destinations?.[id]
              ? flowAnchor(this.scene, gather.destinations[id])
              : this.safe({
                  x: anchors.advent.x - 60 + i * 120,
                  y: anchors.advent.y + 35,
                });
            if (!(
              distance(resident.position, target) < 45 &&
              distance(resident.position, this.scene.player) < 40
            ))
              this.walk(id, resident.position, target, delta, 40, "village");
          }
        }
      } else if (this.runtime.escort?.phase === "place") {
        this.runtime.escort.phase = "return";
        this.checkpoint();
      }
      this.escort(delta);
      if (
        !this.polish.active &&
        distance(this.scene.loyal, this.scene.player) > 36
      )
        this.walk(
          "loyal",
          this.scene.loyal,
          { x: this.scene.player.x - 28, y: this.scene.player.y + 10 },
          delta,
          120,
        );
      if (this.flocon) {
        const target = {
          x: this.scene.player.x - 48,
          y: this.scene.player.y + 22,
        };
        if (distance(this.flocon, target) > 24)
          this.walk("flocon", this.flocon, target, delta, 135);
        animateActor(this.flocon);
        this.flocon.setDepth(this.flocon.y);
        this.polish.fox(
          this.flocon,
          delta,
          this.scene.state.room === "house" && this.progress.complete
            ? "home"
            : "quiet",
          this.reduced,
        );
      }
      if (!this.runtime.visited.includes(this.scene.state.room)) {
        this.runtime.visited.push(this.scene.state.room);
        this.checkpoint();
      }
    }
    this.flow?.update(delta);
    this.renderDialogue();
    if (this.scene.tree && !this.busy)
      this.scene.tree.setFrame(
        "sapin_" + String(this.treeFrame).padStart(2, "0"),
      );
    this.autosave += delta;
    if (this.autosave >= 5000) {
      this.autosave = 0;
      this.checkpoint();
    }
    this.scene.game.canvas.dataset.narrative = JSON.stringify({
      ...this.view,
      book: !!this.view.book,
      runtime: this.runtime,
      sceneIndex: this.progress.sceneIndex,
      objectives: this.progress.objectives,
      choices: this.progress.choices,
      targets: this.candidates(),
      treeFrame: this.scene.tree?.frame.name ?? null,
    });
  }
  private gatherReady() {
    const g = this.script.flow?.gather;
    if (!g) return true;
    return g.actors.every((id, index) => {
      if (id === "mira")
        return (
          this.runtime.escort?.room === "village" &&
          distance(this.runtime.escort.position, { x: 1015, y: 795 }) < 45
        );
      const target = g.destinations?.[id]
        ? flowAnchor(this.scene, g.destinations[id])
        : {
            x:
              anchors.advent.x -
              60 +
              g.actors.filter((a) => a !== "mira").indexOf(id) * 120,
            y: anchors.advent.y + 35,
          };
      const actor = this.scene.living.get(g.actors[index]);
      return (
        !!actor &&
        (distance(actor.position, target) < 10 ||
          (distance(actor.position, target) < 45 &&
            distance(actor.position, this.scene.player) < 40))
      );
    });
  }
  update(delta: number) {
    this.polish.update(
      delta,
      this.dialogueActive || this.busy || controls.paused || document.hidden,
      this.reduced,
    );
    this.scene.game.canvas.dataset.gesture = this.polish.gesture ?? "";
    if (this.dialogueActive || controls.paused) this.polish.resetFox();
    if (this.flow) {
      this.updateFlow(delta);
      return;
    }
    if (this.disposed || document.hidden || this.error) return;
    if (this.lastPlayer !== this.scene.player) this.roomRendered();
    if (controls.paused && !this.busy) return;
    if (this.scene.dialogue && !this.dialogueActive) return;
    if (this.cue !== this.current.kind) {
      this.cue = this.current.kind;
      playSceneAudio(this.cue);
    }
    const stage = presentation(this.progress);
    if (stage.introRemaining > 0) {
      stage.introRemaining = Math.max(0, stage.introRemaining - delta);
      if (stage.introRemaining === 0) {
        this.checkpoint();
        this.scene.emit();
      }
      return;
    }
    const r = this.runtime,
      kind = this.current.kind,
      village = this.scene.state.room === "village";
    if (!r.visited.includes(this.scene.state.room)) {
      r.visited.push(this.scene.state.room);
      this.checkpoint();
    }
    this.escort(delta);
    if (
      kind === "scatter" &&
      r.dispersed &&
      !this.dialogueActive &&
      !r.cinematic &&
      this.scatterReady()
    )
      this.beginDialogue("scatter");
    if (this.busy) this.effect(delta);
    else {
      if (!r.origin) {
        r.origin = { ...this.scene.state.position };
        this.checkpoint();
      }
      if (
        kind === "arrival" &&
        this.progress.objectives.some((id) => id.endsWith("/welcome")) &&
        distance(r.origin, this.scene.player) > 10
      )
        this.event({ kind: "explore", target: "first-walk" });
      if (
        kind === "meet" &&
        village &&
        distance(this.scene.player, this.center) < 100
      )
        this.event({ kind: "explore", target: "central-square" });
      if (kind === "scatter" && !r.dispersalStarted && !this.dialogueActive)
        this.startEffect("scatter");
      if (kind === "trail") {
        r.hintMs = activeHintTime(
          r.hintMs,
          delta,
          this.dialogueActive || controls.paused || document.hidden,
        );
        if (r.hintMs >= 60000 && stage.hintSpoken < 2 && !this.dialogueActive) {
          stage.hintSpoken = 2;
          this.hintLine = `Loyal — ${this.script.hints?.[r.clueIndex] ?? this.current.prompt}`;
          this.scene.dialogue = this.hintLine;
          this.checkpoint();
          this.scene.emit();
        }
      }
      const loyalTarget =
        kind === "arrival" && village && !this.dialogueActive
          ? { x: this.entry.x - 40, y: this.entry.y }
          : { x: this.scene.player.x - 30, y: this.scene.player.y + 10 };
      if (
        !this.dialogueActive &&
        !this.polish.active &&
        distance(this.scene.loyal, loyalTarget) > 12
      )
        this.walk("loyal", this.scene.loyal, loyalTarget, delta, 120);
      if (this.flocon) {
        const target =
          this.scene.state.room === "house" && this.runtime.restored
            ? this.safe(bindings.foxCushion)
            : { x: this.scene.loyal.x - 25, y: this.scene.loyal.y + 20 };
        if (!this.dialogueActive && distance(this.flocon, target) > 15)
          this.walk("flocon", this.flocon, target, delta, 135);
        this.flocon.setDepth(this.flocon.y);
        animateActor(this.flocon);
        if (kind === "trail" && r.hintMs >= 30000)
          this.face(this.flocon, this.cluePoint);
        if (this.dialogueActive) this.face(this.scene.loyal, this.scene.player);
        this.polish.fox(
          this.flocon,
          delta,
          this.dialogueActive || kind === "trail" || this.busy
            ? "blocked"
            : this.scene.state.room === "house" && this.runtime.restored
              ? "home"
              : kind === "restore"
                ? "discovery"
                : "quiet",
          this.reduced,
        );
      }
    }
    if (
      village &&
      !this.dialogueActive &&
      !this.busy &&
      !this.progress.complete &&
      (kind === "trail" || (kind === "restore" && !r.restored))
    ) {
      if (!this.marker?.scene)
        this.marker = this.scene.add
          .image(
            0,
            0,
            kind === "trail" && r.clueIndex === 2
              ? "narrative-bell"
              : "quest_star",
          )
          .setScale(kind === "restore" ? 0.7 : 0.25)
          .setDepth(5000);
      const p =
        kind === "restore"
          ? { x: this.bench.x, y: this.bench.top }
          : this.cluePoint;
      this.marker
        .setName(
          kind === "restore"
            ? "narrative:star-cue"
            : [
                "narrative:golden-snow",
                "narrative:window-reflection",
                "narrative:bell",
              ][r.clueIndex],
        )
        .setPosition(
          p.x,
          kind === "trail" ? p.y - [5, 48, 36][r.clueIndex] : p.y,
        )
        .setScale(kind === "restore" ? 0.7 : r.clueIndex === 2 ? 1 : 0.2)
        .setAlpha(
          this.reduced
            ? 0.85
            : kind === "trail" && r.hintMs < 90000
              ? 0.5
              : 0.85 + Math.sin(this.scene.time.now / 700) * 0.1,
        );
    } else if (this.marker?.scene) this.marker.setVisible(false);
    if (
      this.marker?.scene &&
      village &&
      !this.progress.complete &&
      (kind === "trail" || (kind === "restore" && !r.restored)) &&
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
      identity: {
        debbyVisible: this.scene.player.visible,
        loyalVisible: this.scene.loyal.visible,
        pairOverlays: this.scene.children.list.filter((o) => {
          const s = o as Phaser.GameObjects.Sprite;
          return s.visible && /^(calin|mains)_atlas/.test(s.texture?.key ?? "");
        }).length,
      },
      polish: {
        gesture: this.polish.gesture,
        bounds: this.polish.bounds,
        foxFrame: this.flocon?.frame.name,
        foxTexture: this.flocon?.texture.key,
      },
      treeFrame: this.scene.tree?.frame.name ?? null,
    });
  }
  stop() {
    if (this.disposed) return;
    this.disposed = true;
    this.polish.destroy();
    this.flow?.stop();
    delete this.scene.game.canvas.dataset.gesture;
    this.scene.events.off("postupdate", this.pose);
    this.effects.forEach((i) => i.destroy());
    this.marker?.destroy();
    this.glimmers.forEach((i) => i.destroy());
    clearReaction(this.scene);
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
  async deactivate() {
    await this.flush();
    await this.clearIntent();
    this.stop();
  }
}
