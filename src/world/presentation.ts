import { ActivityPresentation } from "./activity-presentation";
import type Phaser from "phaser";
import { animateActor } from "../art/actors";
import { faceActor } from "./facing";
import type { LivingWorld } from "./runtime";
import type { Room } from "../rpg/world";
import { facadeBounds } from "../art/village34";
/** One quiet context line at most, separate from names and hidden for player dialogue/menu. */
export class LivingPresentation {
  readonly activities: ActivityPresentation;
  private labels = new Map<string, Phaser.GameObjects.Text>();
  constructor(
    private scene: Phaser.Scene,
    private world: LivingWorld,
  ) {
    this.activities = new ActivityPresentation(scene, world);
  }
  update(
    npcs: { id: string; image: Phaser.GameObjects.Sprite }[],
    room: Room,
    player: { x: number; y: number },
    hidden: boolean,
    plates: Phaser.GameObjects.Container[] = [],
  ) {
    this.activities.beginFrame();
    const view = this.scene.cameras.main.worldView;
    let bubble = false;
    for (const npc of npcs) {
      const a = this.world.get(npc.id);
      if (!a || a.profile.room !== room) continue;
      const shown =
        npc.image.x >= view.x - 60 &&
        npc.image.x <= view.right + 60 &&
        npc.image.y >= view.y - 60 &&
        npc.image.y <= view.bottom + 60;
      const acting = this.activities.render(npc.image, a, shown, hidden);
      if (shown && !acting) {
        npc.image.anims.resume();
        if (a.state === "TALKING_TO_PLAYER" || a.nearPlayer)
          faceActor(npc.image, a.profile.actor, player);
        else if (a.state === "OBSERVING" || a.state === "RESTING") {
          const point = this.world.point(a);
          if (point) faceActor(npc.image, a.profile.actor, point.lookAt);
        } else animateActor(npc.image);
      } else if (!shown) npc.image.anims.pause();
      let label = this.labels.get(a.id);
      if (!label) {
        label = this.scene.add
          .text(0, 0, "", {
            fontFamily: "Nunito",
            fontSize: 8,
            color: "#f6e7cc",
            backgroundColor: "#23333bdd",
            padding: { x: 4, y: 2 },
            resolution: 2,
          })
          .setOrigin(0.5, 1)
          .setDepth(10000);
        this.labels.set(a.id, label);
      }
      label.setText(a.intent?.label ?? "");
      const x =
          Math.round(npc.image.x * this.scene.cameras.main.zoom) /
          this.scene.cameras.main.zoom,
        y = npc.image.y - 77;
      const fits =
        x - label.width / 2 >= view.x + 3 &&
        x + label.width / 2 <= view.right - 3 &&
        y - label.height >= view.y + 3;
      const overlapsPlate = plates.some((p) => {
        if (!p.visible) return false;
        const bounds = p.getBounds();
        return (
          x - label.width / 2 < bounds.right &&
          x + label.width / 2 > bounds.left &&
          y - label.height < bounds.bottom &&
          y > bounds.top
        );
      });
      const overlapsFacade =
        room === "village" &&
        facadeBounds.some(
          (r) =>
            x - label.width / 2 < r.x + r.w &&
            x + label.width / 2 > r.x &&
            y - label.height < r.y + r.h &&
            y > r.y,
        );
      const show =
        !hidden &&
        !bubble &&
        shown &&
        fits &&
        !overlapsPlate &&
        !overlapsFacade &&
        !a.nearPlayer &&
        (a.state === "OBSERVING" || a.state === "RESTING") &&
        a.arrivalAge < 3200;
      label.setPosition(x, y).setVisible(show);
      if (show) bubble = true;
    }
  }
}
