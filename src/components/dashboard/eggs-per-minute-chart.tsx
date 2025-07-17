// src/components/dashboard/eggs-per-minute-chart.tsx
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  type ResponsiveContainer
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchLatestSensors, Sensors } from "@/lib/data";

interface ChartPoint {
  name: string;
  eggs: number;
}

export function EggsPerMinuteChart() {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestSensors()
      .then((sensors: Sensors) => {
        // Convertimos { SensorA:24, SensorB:22, … } → [ { name:"SensorA", eggs:24 }, … ]
        const arr: ChartPoint[] = Object.entries(sensors).map(
          ([sensor, value]) => ({
            name: sensor,
            eggs: value,
          })
        );
        setData(arr);
      })
      .catch((err) => {
        console.error(err);
        setError("Error al leer datos de Firebase");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Huevos por sensor (última lectura)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p>Cargando datos…</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="eggs"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
