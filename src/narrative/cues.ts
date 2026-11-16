import type Phaser from "phaser";
/** Small code-native pixel icon; generated once, transparent, no external resource. */
export function prepareNarrativeCues(scene: Phaser.Scene) {
  if (scene.textures.exists("narrative-bell")) return;
  scene.textures.generate("narrative-bell", {
    pixelWidth: 1,
    pixelHeight: 1,
    palette: {
      "0": "#654536",
      "1": "#654536",
      "2": "#b27b44",
      "3": "#eac575",
      "4": "#fff0bb",
      "5": "#654536",
      "6": "#654536",
      "7": "#654536",
      "8": "#654536",
      "9": "#654536",
      A: "#654536",
      B: "#654536",
      C: "#654536",
      D: "#654536",
      E: "#654536",
      F: "#654536",
    },
    data: [
      ".....11.....",
      "....1331....",
      ".....11.....",
      "....1331....",
      "...134321...",
      "...134321...",
      "..13433321..",
      "..13433321..",
      "..13333321..",
      ".1343333321.",
      ".1444443321.",
      ".1222222221.",
      "....1331....",
      ".....11.....",
    ],
  });
}
