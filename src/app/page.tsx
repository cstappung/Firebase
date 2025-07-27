"use client";

import { useState, useEffect } from "react";
import { DailyCounter } from "@/components/dashboard/daily-counter";
import { EggsPerHourChart } from "@/components/dashboard/eggs-per-hour-chart";
import { EggsPerMinuteChart } from "@/components/dashboard/eggs-per-minute-chart";
import { EggIcon } from "@/components/icons/egg-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getHenhouseNames } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemLogs } from "@/components/dashboard/system-logs";
import { EggsPerSensorChart } from "@/components/dashboard/eggs-per-sensor-chart";

export default function Home() {
  const [henhouse, setHenhouse] = useState("all");
  const [henhouses, setHenhouses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHenhouses() {
      setLoading(true);
      const names = await getHenhouseNames();
      setHenhouses(names);
      setLoading(false);
    }
    fetchHenhouses();
  }, []);

  const formatHenhouseName = (name: string) => {
    if (name.startsWith("Pabellon_")) {
      return `Pabellón ${name.split("_")[1]}`;
    }
    return name;
  };

  const henhouseValue = (name: string) => {
     if (name.startsWith("Pabellon_")) {
      return `gallinero-${name.split("_")[1]}`;
    }
    return name;
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <EggIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Eggspress Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {loading ? (
              <Skeleton className="h-10 w-[180px]" />
            ) : (
              <Select onValueChange={setHenhouse} defaultValue={henhouse}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar pabellón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Pabellones</SelectItem>
                  {henhouses.map((name) => (
                    <SelectItem key={name} value={henhouseValue(name)}>
                      {formatHenhouseName(name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid gap-8">
          <DailyCounter henhouse={henhouse} />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <EggsPerMinuteChart henhouse={henhouse} />
            <EggsPerHourChart henhouse={henhouse} />
          </div>
          <EggsPerSensorChart henhouse={henhouse} />
          <SystemLogs henhouse={henhouse} />
        </div>
      </main>
    </div>
  );
}
