import { supabaseClient } from "../advent/supabase";
import { validateEpisodeContext, type EpisodeContext } from "./context";
import {
  validateScript,
  type EpisodeProgress,
  type EpisodeScript,
} from "./script";
export type EpisodeStatus = {
  day: number;
  available: boolean;
  unlocked: boolean;
  complete: boolean;
  restored: boolean;
  title: string | null;
};
export type EpisodeSession = {
  context?: EpisodeContext;
  completedAt?: string | null;
  content: EpisodeScript;
  progress: EpisodeProgress | null;
  runId: string;
  revision: number;
  restored: boolean;
  complete: boolean;
};
export interface EpisodeAPI {
  userId: string;
  mode: "private" | "author";
  preview: boolean;
  status(): Promise<EpisodeStatus[]>;
  load(
    day: number,
    replay?: boolean,
    restart?: boolean,
  ): Promise<EpisodeSession>;
  adminPut?(input: unknown): Promise<void>;
  save(
    day: number,
    runId: string,
    expected: number,
    progress: EpisodeProgress,
  ): Promise<void | {
    revision: number;
    restored: boolean;
    completedAt: string | null;
  }>;
}
export function privateEpisodeAPI(
  userId: string,
  preview: boolean,
  admin = false,
): EpisodeAPI {
  async function rpc<T>(
    name: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    const { data, error } = await supabaseClient().rpc(name, args);
    if (error)
      throw Error(
        error.code === "PGRST202"
          ? "Module narratif non installé sur Supabase."
          : error.message,
      );
    return data as T;
  }
  return {
    userId,
    mode: "private",
    preview,
    status: () => rpc("episode_status", { p_preview: preview }),
    async load(day, replay = false, restart = false) {
      const session = await rpc<EpisodeSession>("episode_load", {
        p_day: day,
        p_preview: preview,
        p_replay: replay,
        p_restart: restart,
      });
      return {
        ...session,
        content: validateScript(session.content),
        context: validateEpisodeContext(session.context),
      };
    },
    ...(admin
      ? {
          adminPut: async (input: unknown) => {
            await rpc("episode_admin_put", {
              p_content: validateScript(input),
            });
          },
        }
      : {}),
    async save(day, runId, expected, progress) {
      return await rpc<{
        revision: number;
        restored: boolean;
        completedAt: string | null;
      }>("episode_save", {
        p_day: day,
        p_preview: preview,
        p_run: runId,
        p_expected: expected,
        p_progress: progress,
      });
    },
  };
}
