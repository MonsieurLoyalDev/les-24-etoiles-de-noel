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
