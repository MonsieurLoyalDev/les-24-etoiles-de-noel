import { it, expect, beforeEach, afterEach, vi } from "vitest";
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "sb_publishable_example");
});
afterEach(() => vi.unstubAllEnvs());
it("refuse une configuration privée absente sans revenir en démonstration", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  const { supabaseClient } = await import("../src/advent/supabase");
  expect(() => supabaseClient()).toThrow("Configuration privée absente");
});
it("refuse une clé serveur moderne dans le client", async () => {
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "sb_secret_EXEMPLE_FICTIF");
  const { supabaseClient } = await import("../src/advent/supabase");
  expect(() => supabaseClient()).toThrow("clé serveur interdite");
});
it("refuse un ancien JWT service_role dans le client", async () => {
  vi.stubEnv(
    "VITE_SUPABASE_ANON_KEY",
    `header.${btoa(JSON.stringify({ role: "service_role" }))}.signature_fictive`,
  );
  const { supabaseClient } = await import("../src/advent/supabase");
  expect(() => supabaseClient()).toThrow("service_role interdite");
});
it("refuse un endpoint distant sans HTTPS", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "http://example.supabase.co");
  const { supabaseClient } = await import("../src/advent/supabase");
  expect(() => supabaseClient()).toThrow("URL Supabase invalide");
});
