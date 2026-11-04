import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";
import {
  openSync,
  closeSync,
  readSync,
  fstatSync,
  appendFileSync,
  lstatSync,
  readFileSync,
  createReadStream,
  createWriteStream,
  unlinkSync,
} from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
const magic = Buffer.from("ETB1");
export function loadBackupKey(path) {
  const stat = lstatSync(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    (process.platform !== "win32" && (stat.mode & 0o077) !== 0)
  )
    throw Error("Backup key must be a private regular file (0600)");
  const s = readFileSync(path, "utf8").trim(),
    key = Buffer.from(s, "base64");
  if (key.length !== 32 || key.toString("base64") !== s)
    throw Error(
      "Backup key must contain exactly 32 random bytes encoded as base64",
    );
  return key;
}
export async function encrypt(source, path, key, aad) {
  const fd = openSync(path, "wx", 0o600);
  const out = createWriteStream(path, { fd });
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad));
  out.write(Buffer.concat([magic, iv]));
  await pipeline(source, cipher, out);
  appendFileSync(path, cipher.getAuthTag());
}
export async function decrypt(path, outPath, key, aad) {
  const input = openSync(path, "r");
  let header, tag, size;
  try {
    size = fstatSync(input).size;
    if (size < 32) throw Error("Truncated backup");
    header = Buffer.alloc(16);
    tag = Buffer.alloc(16);
    readSync(input, header, 0, 16, 0);
    readSync(input, tag, 0, 16, size - 16);
  } finally {
    closeSync(input);
  }
  if (!header.subarray(0, 4).equals(magic))
    throw Error("Unknown encrypted backup format");
  const fd = openSync(outPath, "wx", 0o600);
  const decipher = createDecipheriv("aes-256-gcm", key, header.subarray(4));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(tag);
  try {
    await pipeline(
      size === 32
        ? Readable.from([])
        : createReadStream(path, { start: 16, end: size - 17 }),
      decipher,
      createWriteStream(outPath, { fd }),
    );
  } catch (e) {
    unlinkSync(outPath);
    throw e;
  }
}
export async function fileHash(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
