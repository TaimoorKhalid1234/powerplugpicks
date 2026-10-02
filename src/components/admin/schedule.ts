/** Convert an editorial wall-clock time to UTC, rejecting impossible local times. */
export function scheduledInstant(local: string, timeZone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  if (!Number.isFinite(target) || hour > 23 || minute > 59 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const parts = (instant: number) => Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type, part.value]));
    let instant = target;
    for (let attempt = 0; attempt < 3; attempt++) { const displayed = parts(instant); const asUtc = Date.UTC(Number(displayed.year), Number(displayed.month) - 1, Number(displayed.day), Number(displayed.hour), Number(displayed.minute)); instant += target - asUtc; }
    const displayed = parts(instant);
    if (`${displayed.year}-${displayed.month}-${displayed.day}T${displayed.hour}:${displayed.minute}` !== local) return null;
    return new Date(instant).toISOString();
  } catch { return null; }
}

export function scheduleLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "longOffset" }).format(new Date(iso));
}
