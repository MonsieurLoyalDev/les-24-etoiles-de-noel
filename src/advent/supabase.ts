import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AdventAPI } from "./api";
import { uuid } from "./id";
import {
  validateEditable,
  type Day,
  type DayStatus,
  type EditableDay,
  type Run,
} from "./model";
let client: SupabaseClient | undefined;
export function supabaseClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL,
    key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || key.startsWith("sb_secret_"))
    throw Error("Configuration privée absente ou clé serveur interdite.");
  if (
    !url.startsWith("https://") &&
    !/^http:\/\/(localhost|127\.0\.0\.1):/.test(url)
  )
    throw Error("URL Supabase invalide");
  try {
    const payload = JSON.parse(
      atob((key.split(".")[1] ?? "").replaceAll("-", "+").replaceAll("_", "/")),
    );
    if (payload.role === "service_role")
      throw Error("Clé service_role interdite dans le navigateur");
  } catch (error) {
    if (error instanceof Error && error.message.includes("interdite"))
      throw error;
  }
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}
export async function createPrivateAPI(): Promise<AdventAPI> {
  const sb = supabaseClient();
  const {
    data: { user },
    error,
  } = await sb.auth.getUser();
  if (error || !user) throw Error("Connexion privée requise");
  const membership = await sb
    .from("app_members")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (membership.error)
    throw Error("Ce compte n’est pas invité dans Étoilebois.");
  const admin = membership.data.role === "admin";
  async function rpc<T>(
    name: string,
    args: Record<string, unknown> = {},
  ): Promise<T> {
    const { data, error } = await sb.rpc(name, args);
    if (error) throw Error(error.message);
    return data as T;
  }
  return {
    mode: "supabase",
    userId: user.id,
    isAdmin: admin,
    developerAllowed: admin,
    status: (preview) =>
      rpc<DayStatus[]>("advent_status", { p_preview: preview }),
    day: (day, preview) =>
      rpc<Day>("advent_day", { p_day: day, p_preview: preview }),
    start: (day, preview, replay = false) =>
      rpc<Run>("advent_start", {
        p_day: day,
        p_preview: preview,
        p_replay: replay,
      }),
    check: (day, run, step, value, preview) =>
      rpc("advent_check_step", {
        p_day: day,
        p_run: run,
        p_step: step,
        p_value: value,
        p_preview: preview,
      }),
    adminGet: (day) => rpc<EditableDay>("advent_admin_get", { p_day: day }),
    async adminSave(input) {
      const d = validateEditable(input);
      await rpc("advent_admin_save", {
        p_content: d.content,
        p_rules: d.rules,
      });
    },
    async media(path, day) {
      if (path.startsWith("/demo/"))
        throw Error(
          "Importer ce média fictif dans le stockage privé avant utilisation en mode Supabase.",
        );
      if (!path.startsWith(`${day}/`))
        throw Error("Média associé à une autre journée");
      const { data, error } = await sb.storage
        .from("advent-media")
        .createSignedUrl(path, 300);
      if (error) throw Error(error.message);
      return data.signedUrl;
    },
    async upload(day, file) {
      if (!admin) throw Error("Administrateur requis");
      const allowed = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "video/mp4",
        "video/webm",
        "audio/mpeg",
        "audio/ogg",
      ];
      if (file.size > 52428800 || !allowed.includes(file.type))
        throw Error("Type de fichier ou taille non autorisés");
      const extension = file.type.split("/")[1].replace("jpeg", "jpg");
      const path = `${day}/${uuid()}.${extension}`;
      const { error } = await sb.storage
        .from("advent-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw Error(error.message);
      return path;
    },
  };
}
