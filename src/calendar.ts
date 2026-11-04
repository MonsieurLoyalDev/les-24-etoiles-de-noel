// Production must call a trusted server. No future surprises are bundled.
export interface CalendarAPI {
  getUnlockedDays(): Promise<number[]>;
  getDay(day: number): Promise<{ text: string }>;
}
export const calendar: CalendarAPI = {
  async getUnlockedDays() {
    return [];
  },
  async getDay() {
    throw new Error("Calendrier réel non connecté. Démonstration uniquement.");
  },
};
export const calendarPolicy = {
  timezone: "Europe/Paris",
  mode: "demo",
  days: 24,
} as const;
// Only the server response grants production access. Client clock and local
// demo stars never unlock a production surprise.
export function createServerCalendar(base = "/api/advent"): CalendarAPI {
  const request = async (path: string) => {
    const response = await fetch(`${base}${path}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(
        "Ce jour est verrouillé ou le calendrier est indisponible.",
      );
    return response.json();
  };
  return {
    async getUnlockedDays() {
      const data = await request("");
      if (
        !Array.isArray(data.days) ||
        data.days.some(
          (n: unknown) =>
            !Number.isInteger(n) || Number(n) < 1 || Number(n) > 24,
        )
      )
        throw new Error("Réponse calendrier invalide");
      return data.days;
    },
    async getDay(day) {
      if (!Number.isInteger(day) || day < 1 || day > 24)
        throw new Error("Jour invalide");
      const data = await request(`/${day}`);
      if (typeof data.text !== "string") throw new Error("Contenu invalide");
      return { text: data.text };
    },
  };
}
