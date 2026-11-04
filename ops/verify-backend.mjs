import { createClient } from "@supabase/supabase-js";
const url = process.env.VITE_SUPABASE_URL,
  key = process.env.VITE_SUPABASE_ANON_KEY;
if (
  !url ||
  new URL(url).protocol !== "https:" ||
  !key ||
  key.startsWith("sb_secret_")
)
  throw Error("HTTPS backend and public key required");
const make = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const anonymous = make();
const status = await anonymous.rpc("advent_status", { p_preview: false });
if (!status.error) throw Error("Anonymous calendar access must fail");
const missingCaptcha = await anonymous.auth.signInWithPassword({
  email: "etoilebois-probe@example.invalid",
  password: "invalid-fixture-password",
});
if (
  !missingCaptcha.error ||
  !(
    /captcha/i.test(missingCaptcha.error.code ?? "") ||
    /captcha/i.test(missingCaptcha.error.message)
  )
)
  throw Error("Server CAPTCHA enforcement not verified");
async function account(prefix) {
  const email = process.env[`ETB_TEST_${prefix}_EMAIL`],
    password = process.env[`ETB_TEST_${prefix}_PASSWORD`],
    captchaToken = process.env[`ETB_TEST_${prefix}_CAPTCHA_TOKEN`];
  if (!email || !password || !captchaToken)
    throw Error("Dedicated test accounts and fresh CAPTCHA tokens required");
  const client = make(),
    result = await client.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });
  if (result.error) throw Error(`Test ${prefix} login failed`);
  return client;
}
const player = await account("PLAYER"),
  admin = await account("ADMIN");
try {
  const { data: days, error } = await player.rpc("advent_status", {
    p_preview: false,
  });
  if (error || !Array.isArray(days) || days.length !== 24)
    throw Error("Member status failed");
  const future = days.find((d) => !d.unlocked),
    open = days.find((d) => d.unlocked);
  if (future) {
    if (
      !(await player.rpc("advent_day", { p_day: future.day, p_preview: false }))
        .error
    )
      throw Error("Future content leaked");
    const direct = await player
      .from("advent_days")
      .select("day")
      .eq("day", future.day);
    if (direct.error || direct.data.length)
      throw Error("Direct future table read must be empty");
    if (
      !(await player.rpc("advent_day", { p_day: future.day, p_preview: true }))
        .error
    )
      throw Error("Player preview must fail");
  }
  if (!(await player.rpc("advent_admin_get", { p_day: 24 })).error)
    throw Error("Player editor must fail");
  const editable = await admin.rpc("advent_admin_get", { p_day: 24 });
  if (editable.error || !editable.data?.rules)
    throw Error("Admin editor read failed");
  if (open) {
    const d = await player.rpc("advent_day", {
      p_day: open.day,
      p_preview: false,
    });
    if (d.error || d.data?.day !== open.day)
      throw Error("Opened day inaccessible");
  }
  const path = process.env.ETB_FUTURE_MEDIA_PATH;
  if (future) {
    if (!path?.startsWith(`${future.day}/`))
      throw Error("Provide a real private media path for the first locked day");
    const control = await admin.storage
      .from("advent-media")
      .createSignedUrl(path, 60);
    if (control.error || !control.data?.signedUrl)
      throw Error("Admin cannot access the private media fixture");
    const response = await fetch(control.data.signedUrl, {
      headers: { Range: "bytes=0-0" },
    });
    if (!response.ok)
      throw Error("Private media fixture missing or unreadable");
    await response.body?.cancel();
    if (
      !(await player.storage.from("advent-media").createSignedUrl(path, 60))
        .error
    )
      throw Error("Future signed URL must fail");
    const publicUrl = `${url}/storage/v1/object/public/advent-media/${path.split("/").map(encodeURIComponent).join("/")}`;
    if ((await fetch(publicUrl)).ok)
      throw Error("Private media publicly readable");
  }
  console.log(
    JSON.stringify({
      anonymousBlocked: true,
      captchaEnforced: true,
      adminRole: true,
      playerEditorDenied: true,
      futureChecks: future
        ? "passed"
        : "not applicable: all 2026 dates already open",
      openedDay: open ? "passed" : "not applicable: no date open yet",
      progressMutated: false,
    }),
  );
} finally {
  await player.auth.signOut({ scope: "local" });
  await admin.auth.signOut({ scope: "local" });
}
