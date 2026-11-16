import Phaser from "phaser";
import catalog from "./catalog.json";
export type Reaction =
  | "calin"
  | "bisou"
  | "mains"
  | "rechauffe"
  | "boude"
  | "coeur"
  | "coucou"
  | "etoile"
  | "froid"
  | "joie"
  | "lecture"
  | "lettre";
const active = new WeakMap<Phaser.Scene, () => void>();
export function clearReaction(scene: Phaser.Scene) {
  active.get(scene)?.();
  active.delete(scene);
}
const cache = new WeakMap<Phaser.Scene, Map<string, string>>();
/** Cosmetic overlay only: no save mutation, movement, dialogue or quest effects. */
export function reaction(
  scene: Phaser.Scene,
  kind: Reaction,
  debby: Phaser.GameObjects.Sprite,
  loyal: Phaser.GameObjects.Sprite,
) {
  active.get(scene)?.();
  const pair = ["calin", "bisou", "mains", "rechauffe"].includes(kind);
  // Legacy ambient triggers (e.g. entering the inn) must never overlay fox-couple art
  // on a private narrative scene. DayOnePolish owns the reviewed human gestures.
  if (pair && (scene as Phaser.Scene & { narrative?: unknown }).narrative)
    return;
  const entry = Object.entries(catalog.atlases).find(([key]) =>
    key.startsWith(`${pair ? kind : "debby_" + kind}_atlas`),
  );
  if (!entry) return;
  const [key, atlas] = entry;
  let cancelled = false,
    overlay: Phaser.GameObjects.Sprite | undefined;
  const clear = () => {
    cancelled = true;
    overlay?.destroy();
    if (debby.active) debby.setVisible(true);
    if (loyal.active) loyal.setVisible(true);
  };
  active.set(scene, clear);
  const play = () => {
    if (cancelled || !debby.active) return;
    const anim = `reaction-${kind}`;
    const loaded = cache.get(scene) ?? new Map<string, string>();
    loaded.delete(key);
    loaded.set(key, anim);
    cache.set(scene, loaded);
    while (loaded.size > 3) {
      const [old, animation] = loaded.entries().next().value!;
      scene.anims.remove(animation);
      scene.textures.remove(old);
      loaded.delete(old);
    }
    if (!scene.anims.exists(anim))
      scene.anims.create({
        key: anim,
        frames: Object.keys(atlas.data.frames)
          .sort()
          .map((frame) => ({ key, frame })),
        frameRate: 4,
        repeat: 0,
      });
    overlay = scene.add
      .sprite(debby.x, debby.y, key)
      .setOrigin(0.5, 1)
      .setDepth(Math.max(debby.y, loyal.y) + 1);
    overlay.setScale((pair ? 90 : 76) / overlay.height);
    debby.setVisible(false);
    if (pair) loyal.setVisible(false);
    overlay.play(anim).once(Phaser.Animations.Events.ANIMATION_COMPLETE, clear);
    // Close immediately when Debby resumes walking; the simulation never waits for a visual.
    const check = () => {
      if (
        !debby.active ||
        Math.hypot(debby.x - overlay!.x, debby.y - overlay!.y) > 2
      )
        clear();
      if (cancelled) scene.events.off("update", check);
    };
    scene.events.on("update", check);
  };
  if (scene.textures.exists(key)) play();
  else {
    scene.load.atlas(key, atlas.image, atlas.data);
    scene.load.once("complete", play);
    scene.load.start();
  }
}
