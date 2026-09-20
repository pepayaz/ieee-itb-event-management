const EVENT_TIME_ZONE = "Asia/Jakarta";

// WIB tidak mengenal daylight saving, jadi offsetnya tetap sepanjang tahun.
const EVENT_TIME_ZONE_OFFSET = "+07:00";

const EVENT_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeStyle: "short",
  // Zona waktu dikunci. Tanpa ini tanggal dirender memakai zona waktu
  // server, sehingga jam yang sama tampil berbeda antara mesin lokal dan
  // server production.
  timeZone: EVENT_TIME_ZONE,
});

const DATE_TIME_LOCAL_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatEventDate(date: Date): string {
  return EVENT_DATE_FORMAT.format(date);
}

/**
 * Nilai untuk input `datetime-local`, yaitu string naif tanpa zona waktu.
 * `toISOString().slice(0, 16)` menghasilkan jam UTC, sehingga form edit akan
 * menampilkan waktu tujuh jam lebih awal dan menyimpannya kembali menggeser
 * data.
 */
export function toDateTimeLocalValue(date: Date): string {
  const parts = Object.fromEntries(
    DATE_TIME_LOCAL_PARTS.formatToParts(date).map((part) => [
      part.type,
      part.value,
    ]),
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * Kebalikan dari `toDateTimeLocalValue`. Offset WIB ditempelkan eksplisit,
 * bukan mengandalkan `new Date(value)` yang membaca string naif sebagai waktu
 * lokal mesin, karena admin yang memakai zona waktu lain akan menyimpan jam
 * yang bergeser.
 */
export function fromDateTimeLocalValue(value: string): string {
  return new Date(`${value}:00${EVENT_TIME_ZONE_OFFSET}`).toISOString();
}
