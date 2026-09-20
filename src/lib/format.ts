const EVENT_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeStyle: "short",
  // Zona waktu dikunci ke WIB. Tanpa ini, tanggal dirender memakai zona
  // waktu server, sehingga jam yang sama tampil berbeda antara mesin lokal
  // dan server production.
  timeZone: "Asia/Jakarta",
});

export function formatEventDate(date: Date): string {
  return EVENT_DATE_FORMAT.format(date);
}
