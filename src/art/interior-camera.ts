import type Phaser from "phaser";
export function interiorCameraBounds(
  width: number,
  height: number,
  zoom: number,
) {
  const visibleWidth = width / zoom,
    visibleHeight = height / zoom;
  return {
    x: visibleWidth > 480 ? -(visibleWidth - 480) / 2 : 0,
    y: visibleHeight > 352 ? -(visibleHeight - 352) / 2 : 0,
    width: Math.max(480, visibleWidth),
    height: Math.max(352, visibleHeight),
  };
}
/** Visual letterboxing only. Physics remains 480 × 352 and camera follow/zoom are unchanged. */
export function frameInteriorCamera(scene: Phaser.Scene) {
  const camera = scene.cameras.main,
    b = interiorCameraBounds(camera.width, camera.height, camera.zoom);
  camera.setBounds(b.x, b.y, b.width, b.height);
}
