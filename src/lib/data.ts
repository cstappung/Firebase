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
 * Lee la última entrada disponible en /Pabellon_1
 */
export async function fetchLatestSensors(): Promise<Sensors> {
  // Creamos la query: ordena por clave y trae solo el último child
  const q = query(
    ref(db, "Pabellon_1"),
    orderByKey(),
    limitToLast(1)
  );

  // Ejecutamos la lectura una sola vez
  const snap: DataSnapshot = await get(q);

  if (!snap.exists()) {
    throw new Error("No hay datos en Pabellon_1");
  }

  // snap.val() es un objeto { claveTimestamp: { SensorA:…, … } }
  const obj = snap.val() as Record<string, Sensors>;
  const key = Object.keys(obj)[0];          // p.ej. "Pabellon_1-17-07-2025-03-42"
  return obj[key];                          // → { SensorA:24, SensorB:22, … }
}

