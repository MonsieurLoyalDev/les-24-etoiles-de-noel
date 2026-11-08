import type Phaser from "phaser";
export function interiorCameraBounds(
  width: number,
  height: number,
  zoom: number,
  room = { width: 480, height: 352 },
) {
  const visibleWidth = width / zoom,
    visibleHeight = height / zoom;
  return {
    x: visibleWidth > room.width ? -(visibleWidth - room.width) / 2 : 0,
    y: visibleHeight > room.height ? -(visibleHeight - room.height) / 2 : 0,
    width: Math.max(room.width, visibleWidth),
    height: Math.max(room.height, visibleHeight),
  };
}
/** Letterbox small rooms; follow across the larger D.3.3 volumes without stretching. */
export function frameInteriorCamera(
  scene: Phaser.Scene,
  room = { width: 480, height: 352 },
) {
  const camera = scene.cameras.main,
    b = interiorCameraBounds(camera.width, camera.height, camera.zoom, room);
  camera.setBounds(b.x, b.y, b.width, b.height);
}
