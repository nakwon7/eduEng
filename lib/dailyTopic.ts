const seoulDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

export function seoulDateKey(d: Date = new Date()): string {
  return seoulDateFormatter.format(d).replaceAll("-", "");
}

export function getDailyItem<T>(list: T[], d: Date = new Date()): T {
  return list[Number(seoulDateKey(d)) % list.length];
}
