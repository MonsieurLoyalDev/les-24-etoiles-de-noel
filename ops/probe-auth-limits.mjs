// Opt-in only on a dedicated staging Supabase project, never the live game.
if (process.argv[2] !== "--confirm-staging-project")
  throw Error("Explicit staging-only confirmation required");
const origin = new URL(process.env.VITE_SUPABASE_URL ?? "");
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (origin.protocol !== "https:" || !key || key.startsWith("sb_secret_"))
  throw Error("Staging HTTPS origin/public key required");
let verified = false;
for (let attempt = 1; attempt <= 40; attempt++) {
  const r = await fetch(new URL("/auth/v1/token?grant_type=password", origin), {
    method: "POST",
    headers: { apikey: key, "content-type": "application/json" },
    body: JSON.stringify({
      email: "etoilebois-rate-probe@example.invalid",
      password: "wrong-password-fixture",
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (r.status === 429) {
    verified = true;
    console.log(
      JSON.stringify({ serverRateLimit: true, status: 429, attempt }),
    );
    break;
  }
  if (r.ok) throw Error("Unexpected successful fixture login");
  await r.arrayBuffer();
}
if (!verified)
  throw Error(
    "No 429 within the bounded probe; rate limit remains unverified, inspect Supabase settings.",
  );
