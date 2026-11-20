import { it, expect } from "vitest";
import { clips, sampleClip } from "../src/world/activity-clips";
import sheet from "../src/world/pose-celestine.json";
it("D42 lecture : dessins distincts d’ouverture, page tournée et fermeture dans le séjour prévu", () => {
  const frames = new Set(
    Array.from(
      { length: 90 },
      (_, i) => sampleClip(clips.read, i * 100, 9000).frame,
    ),
  );
  expect([...frames].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  expect(sampleClip(clips.read, 0, 9000).phase).toBe("aligning");
  expect(sampleClip(clips.read, 8300, 9000).phase).toBe("finishing");
  expect(
    new Set(
      Array.from(
        { length: 20 },
        (_, i) => sampleClip(clips.read, i * 400, 9000, true).frame,
      ),
    ).size,
  ).toBe(1);
});
it("D42 feuille : seize cellules transparentes séparées, ancrages dans les cellules et assise plus basse", () => {
  expect(Object.keys(sheet.frames)).toHaveLength(16);
  for (const [id, m] of Object.entries(sheet.metrics)) {
    const f = sheet.frames[("pose-" + id) as keyof typeof sheet.frames].frame;
    expect(m.anchorX).toBeGreaterThan(0);
    expect(m.anchorX).toBeLessThan(f.w);
    expect(m.foot).toBeLessThan(f.h);
    expect(m.bounds.x).toBeGreaterThan(2);
    expect(m.bounds.y).toBeGreaterThan(2);
  }
  expect(sheet.metrics["13"].height).toBeLessThan(sheet.referenceHeight);
});
import { LivingWorld } from "../src/world/runtime";
import { LanternCoordinator } from "../src/world/lanterns";
import { ActivityDirector, activityBindings } from "../src/world/activities";
import { rgbaPng } from "./png-rgba";
import { worldPoints } from "../src/world/points";
import celestine from "../src/world/pose-celestine.json";
import emile from "../src/world/pose-emile.json";
import augustin from "../src/world/pose-augustin.json";
const sheetRegistry = { celestine, emile, augustin };
it("D42 toutes les activités déclaratives désignent une feuille et des dessins disponibles", () => {
  for (const clip of Object.values(clips)) {
    const sheet = sheetRegistry[clip.sheet as keyof typeof sheetRegistry];
    expect(sheet, clip.id).toBeDefined();
    expect(
      clip.opening.length && clip.loop.length && clip.closing.length,
    ).toBeTruthy();
    for (const f of [...clip.opening, ...clip.loop, ...clip.closing])
      expect(
        sheet.frames[("pose-" + f) as keyof typeof sheet.frames],
      ).toBeDefined();
  }
  for (const [id, binding] of Object.entries(activityBindings)) {
    expect(worldPoints.some((p) => p.id === id.split(":")[1])).toBe(true);
    if (binding.clip !== "lantern") expect(clips[binding.clip]).toBeDefined();
  }
});
it("D42 la lettre disparaît après le dépôt et ne réapparaît pas en fin de boucle", () => {
  const states = Array.from({ length: 70 }, (_, i) =>
    sampleClip(clips.delivery, i * 100, 7000),
  );
  const deposit = states.findIndex((s) => s.frame === 5);
  expect(deposit).toBeGreaterThan(0);
  expect(states.slice(deposit).some((s) => [2, 3, 4].includes(s.frame))).toBe(
    false,
  );
});
it("D42 l’assise a de vraies poses et se termine par le dessin de redressement", () => {
  expect(sampleClip(clips.seatRead, 2000, 12000).frame).toBe(13);
  expect(sampleClip(clips.seatRead, 11900, 12000).frame).toBe(12);
});
it("D42 réservation lumineuse, allumage unique, progression et refus de rallumer", () => {
  const l = new LanternCoordinator();
  l.update(90000, 0);
  const id = "plaza-evening-lantern";
  expect(l.reserve(id, "noe", true)).toBe(true);
  expect(l.reserve(id, "autre", true)).toBe(false);
  expect(l.commit(id, "autre")).toBe(false);
  expect(l.commit(id, "noe")).toBe(true);
  l.update(90400, 400);
  expect(l.get(id)?.level).toBe(0.5);
  l.update(90800, 400);
  expect(l.get(id)?.level).toBe(1);
  expect(l.commit(id, "noe")).toBe(false);
  expect(l.reserve(id, "noe", true)).toBe(false);
  l.release("noe");
  expect(l.get(id)?.owner).toBeNull();
  l.update(0, 0);
  expect(l.reserve(id, "noe", false)).toBe(true);
  expect(l.commit(id, "noe")).toBe(true);
  l.update(800, 800);
  expect(l.get(id)?.level).toBe(0);
});
it("D42 les gestes interrompus ne déclenchent pas la lumière ; la reprise la déclenche une fois", () => {
  const w = new LivingWorld(),
    a = w.get("noe")!,
    director = new ActivityDirector(),
    l = new LanternCoordinator();
  l.update(90000, 0);
  a.phase = 2;
  a.visits = 1;
  a.state = "OBSERVING";
  a.intent = {
    point: "plaza-evening-lantern",
    label: "lumière",
    dwell: 11000,
    state: "OBSERVING",
  };
  a.remaining = 11000;
  director.update([a], 90000, 16, l);
  a.arrivalAge = 2800;
  a.remaining = 8200;
  a.state = "TALKING_TO_PLAYER";
  director.update([a], 92800, 0, l);
  expect(director.get("noe")?.frame).toBeNull();
  expect(l.get(a.intent.point)?.on).toBe(false);
  a.state = "OBSERVING";
  director.update([a], 92800, 16, l);
  expect(l.get(a.intent.point)?.on).toBe(true);
  director.update([a], 92800, 16, l);
  expect(l.get(a.intent.point)?.commits).toBe(1);
  const other = new ActivityDirector();
  other.update([a], 92800, 16, l);
  expect(other.get("noe")?.clip).toBe("inspect");
});
it("D42 conversation au fauteuil : livre fermé et pose assise conservée", () => {
  const w = new LivingWorld(),
    a = w.get("mira")!,
    d = new ActivityDirector(),
    l = new LanternCoordinator();
  a.phase = 2;
  a.visits = 1;
  a.state = "OBSERVING";
  a.intent = {
    point: "library-armchair",
    label: "lecture",
    dwell: 12000,
    state: "OBSERVING",
  };
  a.arrivalAge = 3000;
  a.remaining = 9000;
  d.update([a], 93000, 16, l);
  expect(d.get("mira")?.seatProgress).toBe(1);
  a.state = "TALKING_TO_PLAYER";
  d.update([a], 93000, 0, l);
  expect(d.get("mira")?.frame).toBe(15);
  expect(d.get("mira")?.object).toBe("book-closed");
  expect(d.get("mira")?.seatProgress).toBe(1);
  a.state = "OBSERVING";
  d.update([a], 93000, 16, l);
  expect(d.get("mira")?.frame).toBe(13);
});
it("Salutation facultative : hors écran et scènes réservées exclues, geste orienté", () => {
  const w = new LivingWorld();
  w.attach("village", 1920, 1408, []);
  const a = w.get("emile")!,
    b = w.get("noe")!;
  for (const p of [a, b]) {
    p.phase = 1;
    p.intent = p.profile.schedule[1][0];
    p.state = "WALKING";
    p.queued = false;
    p.path = [{ x: 900, y: 700 }];
    p.pathIndex = 0;
  }
  a.position = { x: 700, y: 700 };
  b.position = { x: 670, y: 700 };
  w.update(45000, 20, "village", { x: 1900, y: 1350 }, null, () => false);
  expect(a.reaction).toBeNull();
  w.update(45000, 20, "village", { x: 1900, y: 1350 }, null, () => true, new Set(["noe"]));
  expect(a.reaction).toBeNull();
  const before = { ...a.position };
  w.update(45000, 100, "village", { x: 1900, y: 1350 }, null, () => true);
  expect(a.reaction?.clip).toBe("greet");
  expect(w.activities.get("emile")?.flip).toBe(true);
  expect(a.position).toEqual(before);
  expect(a.reactionCooldown).toBeGreaterThan(0);
  w.update(45100, 100, "village", { x: 1900, y: 1350 }, "emile", () => true);
  expect(a.reaction).toBeNull();
  expect(a.state).toBe("TALKING_TO_PLAYER");
});
it("D42 les PNG contiennent une vraie transparence et des cellules propres", () => {
  for (const [name, sheet] of Object.entries(sheetRegistry)) {
    const im = rgbaPng("public/assets/activities-d42/" + name + ".png");
    expect(im.width).toBe(sheet.meta.size.w);
    expect(im.height).toBe(sheet.meta.size.h);
    let transparent = 0;
    for (let i = 3; i < im.data.length; i += 4)
      if (im.data[i] === 0) transparent++;
    expect(transparent / (im.width * im.height)).toBeGreaterThan(0.25);
    for (const f of Object.values(sheet.frames)) {
      for (const [x, y] of [
        [f.frame.x, f.frame.y],
        [f.frame.x + f.frame.w - 1, f.frame.y + f.frame.h - 1],
      ])
        expect(im.data[(y * im.width + x) * 4 + 3]).toBeLessThan(32);
    }
  }
});
import { allFurniture } from "../src/art/rooms33";
it("D42 projection assise et lanternes désignent les objets réels sans les déplacer", () => {
  const seat = worldPoints.find((p) => p.id === "library-armchair")!,
    projection = seat.seatProjection!;
  expect(
    allFurniture("library").some(
      (f) =>
        f.key === projection.fixture.key &&
        f.x === projection.fixture.x &&
        f.y === projection.fixture.y,
    ),
  ).toBe(true);
  expect(seat.position.y + projection.offset.y).toBe(288);
});
import { visible } from "../src/domain";
import environments from "./fixtures/world-d41-environments.json";
it("D42 le dialogue au fauteuil vise l’approche libre sans supprimer la visibilité des murs", () => {
  const rects = environments.find((r) => r.room === "library")!.rects,
    player = { x: 910, y: 326 },
    seat = worldPoints.find((p) => p.id === "library-armchair")!;
  expect(visible(player, seat.position, rects)).toBe(true);
  expect(visible(player, { x: 910, y: 288 }, rects)).toBe(false);
  expect(visible({ x: 830, y: 370 }, { x: 910, y: 370 }, rects)).toBe(false);
});
