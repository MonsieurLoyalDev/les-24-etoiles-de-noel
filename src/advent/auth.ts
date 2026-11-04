type LoginClient = {
  auth: {
    signInWithPassword: (credentials: {
      email: string;
      password: string;
      options?: { captchaToken: string };
    }) => PromiseLike<{ error: { message: string; status?: number } | null }>;
  };
};
export async function privateLogin(
  client: LoginClient,
  email: string,
  password: string,
  token: string,
  requireCaptcha: boolean,
) {
  if (
    !email.trim() ||
    email.length > 254 ||
    !password ||
    password.length > 1024
  )
    throw Error("Identifiants invalides");
  if (requireCaptcha && !token)
    throw Error("Terminez la vérification anti-robot avant de vous connecter.");
  if (token.length > 4096) throw Error("Vérification anti-robot invalide");
  const { error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
    ...(token ? { options: { captchaToken: token } } : {}),
  });
  if (error?.status === 429)
    throw Error("Trop de tentatives. Patientez avant de réessayer.");
  if (error) throw Error(error.message);
}
