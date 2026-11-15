import { type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
export async function recordCanvas(page: Page, path: string, ms: number) {
  const result = await page.locator("canvas").evaluate(async (el, ms) => {
    const canvas = el as HTMLCanvasElement,
      stream = canvas.captureStream(12),
      rec = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 1000000,
      }),
      chunks: BlobPart[] = [],
      trace: unknown[] = [];
    const timer = setInterval(
      () => trace.push(JSON.parse(canvas.dataset.activities ?? "[]")),
      200,
    );
    await new Promise<void>((ok) => {
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => ok();
      rec.start();
      setTimeout(() => rec.stop(), ms);
    });
    clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
    const b = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let data = "";
    for (const v of b) data += String.fromCharCode(v);
    return { data: btoa(data), trace };
  }, ms);
  writeFileSync(path, Buffer.from(result.data, "base64"));
  writeFileSync(path + ".json", JSON.stringify(result.trace, null, 2));
}
export async function recordDOM(
  page: Page,
  path: string,
  ms: number,
  action: () => Promise<void>,
) {
  const size = page.viewportSize()!,
    encoder = await page.context().newPage();
  await encoder.evaluate("window.__name=f=>f");
  await encoder.evaluate(({ width, height }) => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const stream = c.captureStream(0),
      chunks: BlobPart[] = [],
      rec = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 1300000,
      });
    rec.ondataavailable = (e) => chunks.push(e.data);
    (window as unknown as { recording: unknown }).recording = {
      c,
      stream,
      chunks,
      rec,
    };
    rec.start();
  }, size);
  const task = action(),
    end = Date.now() + ms;
  let frames = 0;
  while (Date.now() < end) {
    const start = Date.now(),
      buffer = await page.screenshot({ type: "jpeg", quality: 88 });
    await encoder.evaluate("window.__name=f=>f");
    await encoder.evaluate(async (data) => {
      const r = (
          window as unknown as {
            recording: { c: HTMLCanvasElement; stream: MediaStream };
          }
        ).recording,
        img = new Image();
      img.src = "data:image/jpeg;base64," + data;
      await img.decode();
      r.c.getContext("2d")!.drawImage(img, 0, 0);
      (
        r.stream.getVideoTracks()[0] as MediaStreamTrack & {
          requestFrame(): void;
        }
      ).requestFrame();
    }, buffer.toString("base64"));
    frames++;
    await new Promise((ok) =>
      setTimeout(ok, Math.max(1, 100 - (Date.now() - start))),
    );
  }
  await task;
  const data = await encoder.evaluate(async () => {
    const r = (
      window as unknown as {
        recording: {
          rec: MediaRecorder;
          chunks: BlobPart[];
          stream: MediaStream;
        };
      }
    ).recording;
    await new Promise<void>((ok) => {
      r.rec.onstop = () => ok();
      r.rec.stop();
    });
    r.stream.getTracks().forEach((t) => t.stop());
    const b = new Uint8Array(await new Blob(r.chunks).arrayBuffer());
    let s = "";
    for (const v of b) s += String.fromCharCode(v);
    return btoa(s);
  });
  writeFileSync(path, Buffer.from(data, "base64"));
  await encoder.close();
  return frames;
}
