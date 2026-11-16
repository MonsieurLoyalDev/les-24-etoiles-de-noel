import { anchors } from "../art/village34";
import { furniture33 } from "../art/rooms33";
import { decorativeObjects } from "../decor/model";
import { worldPoints } from "../world/points";
const furnishing = (key: string) =>
  furniture33.house.find((f) => f.key === key)!;
/** Named scene bindings derived from validated map/furniture; no change to geometry. */
export const dayOneBindings = {
  lantern: worldPoints.find((p) => p.id === "plaza-evening-lantern")!,
  // No existing arrival marker in the plan: surveyed free point on the southern route.
  arrival: { x: 1012, y: 1224 },
  square: anchors.advent,
  snow: anchors.hunts[0],
  starArea: anchors.hunts[2],
  libraryDoor: { x: 240, y: 316 },
  houseBook: {
    x: furnishing("reading-corner").x,
    y: furnishing("reading-corner").y + 18,
  },
  houseHearth: {
    x: furnishing("hearth-salon").x,
    y: furnishing("hearth-salon").y + 35,
  },
  houseRest: {
    x: furnishing("house-lounge").x,
    y: furnishing("house-lounge").y + 24,
  },
  foxCushion: {
    x: furnishing("hearth-salon").x - 38,
    y: furnishing("hearth-salon").y + 45,
  },
  houseNote: decorativeObjects.find((o) => o.id === "house-note")!,
};
