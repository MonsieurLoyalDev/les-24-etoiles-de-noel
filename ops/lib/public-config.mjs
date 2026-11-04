export function publicConfig(env) {
  const url = env.VITE_SUPABASE_URL ?? "",
    key = env.VITE_SUPABASE_ANON_KEY ?? "",
    siteKey = env.VITE_TURNSTILE_SITE_KEY ?? "";
  if (key.startsWith("sb_secret_")) throw Error("Server key forbidden in Vite");
  if (key.split(".").length === 3) {
    let role;
    try {
      role = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString(),
      ).role;
    } catch {
      /* Invalid keys fail service validation later. */
    }
    if (role && role !== "anon")
      throw Error("Only anon/publishable key permitted in Vite");
  }
  for (const name of Object.keys(env))
    if (
      name.startsWith("VITE_") &&
      ![
        "VITE_APP_MODE",
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY",
        "VITE_TURNSTILE_SITE_KEY",
      ].includes(name)
    )
      throw Error(`Unexpected public environment variable: ${name}`);
  if (url) {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    )
      throw Error("Supabase HTTPS origin required for build");
  }
  if (siteKey && !/^[A-Za-z0-9_-]{5,200}$/.test(siteKey))
    throw Error("Invalid CAPTCHA public key");
  return {
    mode: "supabase",
    configured: !!(url && key),
    backendOrigin: url ? new URL(url).origin : null,
    captcha: !!siteKey,
  };
}
