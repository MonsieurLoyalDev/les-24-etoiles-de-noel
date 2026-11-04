import { it, expect, vi } from "vitest";
import { privateLogin } from "../src/advent/auth";
it("refuse la connexion sans CAPTCHA si le site le requiert", async () => {
  const signInWithPassword = vi.fn();
  await expect(
    privateLogin(
      { auth: { signInWithPassword } },
      "a@example.com",
      "password",
      "",
      true,
    ),
  ).rejects.toThrow("anti-robot");
  expect(signInWithPassword).not.toHaveBeenCalled();
});
it("transmet le jeton à Supabase pour vérification serveur", async () => {
  const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
  await privateLogin(
    { auth: { signInWithPassword } },
    "a@example.com",
    "password",
    "one-use-token",
    true,
  );
  expect(signInWithPassword).toHaveBeenCalledWith({
    email: "a@example.com",
    password: "password",
    options: { captchaToken: "one-use-token" },
  });
});
it("respecte le refus de limitation serveur 429", async () => {
  const signInWithPassword = vi
    .fn()
    .mockResolvedValue({ error: { status: 429, message: "rate limited" } });
  await expect(
    privateLogin(
      { auth: { signInWithPassword } },
      "a@example.com",
      "password",
      "token",
      true,
    ),
  ).rejects.toThrow("Trop de tentatives");
  expect(signInWithPassword).toHaveBeenCalledTimes(1);
});
