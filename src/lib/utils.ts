import type { AppData, CareTask, Feed, Treatment } from "./types";

export const STORAGE_KEY = "flock-scale:v1";
export function today(now = new Date()): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}-${p.find((x) => x.type === "day")!.value}`;
}
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function monthShift(date: string, months: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const end = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, end));
  return d.toISOString().slice(0, 10);
}
export function formatDate(date: string, full = false): string {
  if (!date) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: full ? "long" : "short",
    ...(full ? { year: "numeric" } : {}),
    timeZone: "Europe/London",
  }).format(new Date(`${date}T12:00:00Z`));
}
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) /
      86400000,
  );
}
export function ageLabel(born: string): string {
  if (!born) return "Age unknown";
  const days = daysBetween(born, today());
  const months = Math.floor(days / 30.44);
  if (months < 1) return `${Math.max(0, days)} days old`;
  if (months < 12) return `${months} months old`;
  return `${Math.floor(months / 12)} yr${months >= 24 ? "s" : ""}${months % 12 ? ` ${months % 12} mo` : ""}`;
}
export const money = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    value,
  );
export const id = () => crypto.randomUUID();
export function feedDays(feed: Feed): number | null {
  return feed.dailyUse > 0 ? Math.floor(feed.stock / feed.dailyUse) : null;
}
// A recorded withdrawal end date is inclusive. Keep eggs out of the food chain through that date.
export function isWithdrawing(t: Treatment, date = today()): boolean {
  return !!t.withdrawalEnd && t.started <= date && date <= t.withdrawalEnd;
}
export function completeTask(tasks: CareTask[], taskId: string): CareTask[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.completed) return tasks;
  const result = tasks.map((t) =>
    t.id === taskId ? { ...t, completed: true } : t,
  );
  if (task.repeatDays > 0)
    result.push({
      ...task,
      id: id(),
      completed: false,
      due: shiftDate(task.due < today() ? today() : task.due, task.repeatDays),
    });
  return result;
}
export function emptyData(): AppData {
  return {
    version: 1,
    demo: false,
    animals: [],
    habitats: [],
    tasks: [],
    logs: [],
    feed: [],
    treatments: [],
    clutches: [],
    checklist: [],
    settings: {
      keeper: "Keeper",
      collection: "My little corner of nature",
      country: "England",
      postcode: "",
      aphaReference: "",
      aphaUpdated: "",
    },
  };
}
export function eggSeries(data: AppData, days = 7, end = today()) {
  return Array.from({ length: days }, (_, i) => {
    const date = shiftDate(end, i - days + 1);
    return {
      date,
      count: data.logs
        .filter((l) => l.kind === "Eggs" && l.date === date)
        .reduce((sum, l) => sum + l.value, 0),
    };
  });
}
