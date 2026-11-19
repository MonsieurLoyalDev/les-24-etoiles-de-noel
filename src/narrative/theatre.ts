import type Phaser from "phaser";
import type { Point } from "../domain";
export function theatreBackdrop(style: unknown) {
  return style === "option-1"
    ? "forest"
    : style === "option-2"
      ? "village"
      : style === "option-3"
        ? "night"
        : null;
}

/** Wooden miniatures only: these sprites never replace the real characters. */
export class TheatrePresentation {
  private container?: Phaser.GameObjects.Container;
  private figures: Phaser.GameObjects.Image[] = [];
  private stars: Phaser.GameObjects.Image[] = [];
  private backdrop?: Phaser.GameObjects.Image;
  constructor(private scene: Phaser.Scene) {}
  render(position: Point, style: unknown, built: boolean) {
    this.destroy();
    const children: Phaser.GameObjects.GameObject[] = [];
    const image = (key: string, x: number, y: number, width: number) => {
      const sprite = this.scene.add
        .image(x, y, "production-" + key)
        .setOrigin(0.5, 1);
      sprite.setScale(width / sprite.width);
      children.push(sprite);
      return sprite;
    };
    // An isolated author preview without an authorized prior choice stays neutral.
    const key = theatreBackdrop(style);
    if (key) this.backdrop = image("theatre-" + key, 0, -46, 112);
    image("theatre-frame", 0, 0, 185);
    if (built) {
      image("theatre-mechanism", 0, -4, 112);
      this.figures = ["debby", "loyal", "flocon"].map((name, i) =>
        image("figure-" + name, (i - 1) * 31, -43, name === "flocon" ? 24 : 27),
      );
      this.stars = [-24, 0, 24].map((x) => {
        const star = this.scene.add
          .image(x, -104, "quest_star")
          .setDisplaySize(5, 5)
          .setName("narrative:theatre-decoration");
        children.push(star);
        return star;
      });
    }
    this.container = this.scene.add
      .container(position.x, position.y, children)
      .setScale(0.5)
      .setDepth(position.y)
      .setName("narrative:theatre");
  }
  update(elapsed: number, moving: boolean, reduced: boolean) {
    if (!this.container?.active) return;
    this.figures.forEach((sprite, i) => {
      sprite.x =
        (i - 1) * 31 +
        (moving && !reduced
          ? Math.round(Math.sin(elapsed / 1100 + i * 2) * 8)
          : 0);
    });
    this.stars.forEach((sprite, i) =>
      sprite.setRotation(moving && !reduced ? elapsed / 4000 + i : 0),
    );
  }
  destroy() {
    if (this.container?.active) this.container.destroy(true);
    this.container = undefined;
    this.figures = [];
    this.stars = [];
    this.backdrop = undefined;
  }
}
