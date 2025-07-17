// src/lib/data.ts
import { db } from "./firebase";
import {
  ref,
  query,
  orderByKey,
  limitToLast,
  get,
  type DataSnapshot
} from "firebase/database";

export interface Sensors {
  SensorA: number;
  SensorB: number;
  SensorC: number;
  SensorD: number;
  SensorE: number;
  SensorF: number;
}

/**
 * Lee la última entrada disponible en /Pabellon_1 (o el nodo que le pases)
 */
export async function fetchLatestSensors(): Promise<Sensors> {
  const q = query(
    ref(db, "Pabellon_1"),
    orderByKey(),
    limitToLast(1)
  );
  const snap: DataSnapshot = await get(q);
  if (!snap.exists()) {
    throw new Error("No hay datos en Pabellon_1");
  }
  const obj = snap.val() as Record<string, Sensors>;
  const key = Object.keys(obj)[0];
  return obj[key];
}

// --------------------------------------------------
// ↓ NUEVO: eggs per hour
// --------------------------------------------------

export interface HourlyDatum {
  hour: number;
  eggs: number;
}

export interface HourlyGroup {
  date: string;            // "2025-07-17"
  data: HourlyDatum[];     // [{ hour: 0, eggs: 12 }, …]
}

/**
 * Fetch eggs per hour para un gallinero dado entre dos fechas (inclusive).
 *
 * Asume que en RTDB tienes un nodo "/{henhouse}" cuyas claves
 * tienen este formato:
 *   "{henhouse}-DD-MM-YYYY-HH-mm"
 * y cada valor es Sensors.
 */
export async function fetchEggsPerHour(
  henhouse: string,
  fromDate: Date,
  toDate: Date
): Promise<HourlyGroup[]> {
  // 1. Traemos todos los nodos bajo /{henhouse}
  const snap: DataSnapshot = await get(ref(db, henhouse));
  if (!snap.exists()) {
    throw new Error(`No hay datos en ${henhouse}`);
  }
  const entries = snap.val() as Record<string, Sensors>;

  // 2. Parseamos cada clave para extraer la fecha, filtramos por rango
  const parsed = Object.entries(entries)
    .map(([key, sensors]) => {
      // clave: "Pabellon_1-17-07-2025-14-30"
      const suffix = key.startsWith(`${henhouse}-`)
        ? key.slice(henhouse.length + 1)
        : key;
      const parts = suffix.split("-");
      if (parts.length < 5) return null;
      const [dayStr, monthStr, yearStr, hourStr, minuteStr] = parts;
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const year = parseInt(yearStr, 10);
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const date = new Date(year, month, day, hour, minute);
      return { date, sensors };
    })
    .filter((x): x is { date: Date; sensors: Sensors } => x !== null)
    .filter(({ date }) => date >= fromDate && date <= toDate);

  // 3. Agrupamos por fecha (YYYY-MM-DD) y hora, acumulando la suma de todos los sensores
  const groupMap: Record<string, Record<number, number>> = {};
  parsed.forEach(({ date, sensors }) => {
    const dateStr = date.toISOString().split("T")[0];
    const hr = date.getHours();
    const totalAtTimestamp = Object.values(sensors).reduce(
      (sum, v) => sum + v,
      0
    );
    if (!groupMap[dateStr]) groupMap[dateStr] = {};
    if (!groupMap[dateStr][hr]) groupMap[dateStr][hr] = 0;
    groupMap[dateStr][hr] += totalAtTimestamp;
  });

  // 4. Convertimos a HourlyGroup[]
  const result: HourlyGroup[] = Object.entries(groupMap)
    .map(([dateStr, hoursMap]) => ({
      date: dateStr,
      data: Object.entries(hoursMap)
        .map(([hrStr, eggs]) => ({
          hour: parseInt(hrStr, 10),
          eggs,
        }))
        .sort((a, b) => a.hour - b.hour),
    }))
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  return result;
}
