import type Phaser from "phaser";
import type { EpisodeScript } from "./script";
/** Reuses the private Advent Storage service; never copies narrative media into public/. */
export async function loadNarrativeMedia(
  scene: Phaser.Scene,
  script: EpisodeScript,
  media: (path: string, day: number) => Promise<string>,
) {
  for (const item of script.flow?.media ?? []) {
    if (scene.textures.exists(item.key)) continue;
    if (item.day > script.day || !item.path.startsWith(`${item.day}/`))
      throw Error("Média narratif hors journée");
    const url = await media(item.path, item.day);
    const response = await fetch(url, { cache: "no-store" });
    if (
      !response.ok ||
      !/^image\/(png|webp|jpeg)(;|$)/.test(
        response.headers.get("content-type") ?? "",
      )
    )
      throw Error("Image privée indisponible ou type invalide");
    const blob = await response.blob();
    if (blob.size > 10 * 1024 * 1024)
      throw Error("Image privée trop volumineuse");
    const local = URL.createObjectURL(blob);
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(Error("Image privée illisible"));
        image.src = local;
      });
      scene.textures.addImage(item.key, image);
    } finally {
      URL.revokeObjectURL(local);
    }
  }
}
