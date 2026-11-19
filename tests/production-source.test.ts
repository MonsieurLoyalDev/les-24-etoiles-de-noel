import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { validateScript, type EpisodeProgress } from "../src/narrative/script";
import { receiveEvent, finishScene } from "../src/narrative/engine";
import { completedEpisodeSnapshots } from "./fixtures/complete-episode";
import { initial } from "../src/domain";

const source = process.env.ETB_PRODUCTION_SOURCE_DIR;
if (source && process.env.CI)
  throw Error("Sources privées interdites en CI publique");
it.skipIf(!source)(
  "les rencontres libres des sources autorisées restent terminables dans les six ordres",
  () => {
    for (const day of [15, 16]) {
      const content = validateScript(
        JSON.parse(readFileSync(join(source!, `episode-${day}.json`), "utf8")),
      );
      const completedDays = Array.from({ length: day - 1 }, (_, i) => i + 1);
      const before = completedEpisodeSnapshots(content, completedDays)[1];
      const goals = content.scenes[2].objectives;
      expect(goals).toHaveLength(3);
      for (const order of [
        [0, 1, 2],
        [0, 2, 1],
        [1, 0, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0],
      ]) {
        let progress = structuredClone(before);
        for (const i of order)
          progress = receiveEvent(
            content,
            progress,
            goals[i].event,
          ) as EpisodeProgress;
        progress = finishScene(content, progress, {
          world: initial,
          completedDays,
        }) as EpisodeProgress;
        expect(progress.sceneIndex).toBe(3);
      }
    }
  },
);

it.skipIf(!source)(
  "les activités facultatives finales ont des approches distinctes et accessibles",
  async () => {
    const { NavigationGrid } = await import("../src/world/navigation");
    const { anchors, facadeBounds, routeSegments, pedestrianCourts } =
      await import("../src/art/village34");
    const environments = JSON.parse(
      readFileSync("tests/fixtures/world-d41-environments.json", "utf8"),
    );
    const nav = new NavigationGrid(
      1920,
      1408,
      [
        ...environments.find((r: { room: string }) => r.room === "village")
          .rects,
        ...facadeBounds,
      ],
      routeSegments,
      pedestrianCourts.map((c) => c.points),
    );
    const script = validateScript(
      JSON.parse(readFileSync(join(source!, "episode-16.json"), "utf8")),
    );
    const points = script.scenes.at(-1)!.flow!.actions.map((a) => {
      expect(a.point.anchor).toBe("square");
      return nav.nearestFree({
        x: anchors.advent.x + (a.point.offset?.x ?? 0),
        y: anchors.advent.y + (a.point.offset?.y ?? 0),
      })!;
    });
    for (let i = 0; i < points.length; i++) {
      expect(points[i]).toBeTruthy();
      expect(
        nav.findPath(nav.nearestFree(anchors.advent)!, points[i]),
      ).not.toBeNull();
      for (let j = 0; j < i; j++)
        expect(
          Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y),
        ).toBeGreaterThan(43);
    }
  },
);
