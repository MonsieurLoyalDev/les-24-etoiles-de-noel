import type { Point } from "../domain";
export type NarrativeView = {
  episodeId: string;
  title: string;
  sceneId: string;
  objective: string;
  revision: number;
  complete: boolean;
  restored: number;
  preview: boolean;
  hintLevel: number;
  saving: boolean;
  error: string;
  book: { title: string; text: string } | null;
  bookRequest: number;
  characters: string[];
  places: string[];
  chosenReplies: string[];
};
export interface NarrativeBridge {
  readonly dialogueActive: boolean;
  readonly choices: string[];
  readonly talkingActor: string | null;
  readonly reservedActors: ReadonlySet<string>;
  readonly busy: boolean;
  readonly ownCompanion: boolean;
  readonly treeFrame: number | null;
  readonly view: NarrativeView;
  candidates(): (Point & { id: string; name: string })[];
  interact(id: string): boolean;
  choose(index: number): void;
  update(delta: number): void;
  roomRendered(): void;
  openBook(): void;
  stop(): void;
}
