"use client";

import { useState } from "react";
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
import { Box } from "lucide-react";

export default function Home() {
  const [henhouse, setHenhouse] = useState("all");

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <EggIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Eggspress Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Box className="h-5 w-5" />
            <Select onValueChange={setHenhouse} defaultValue={henhouse}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar gallinero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Gallineros</SelectItem>
                <SelectItem value="gallinero-1">Gallinero 1</SelectItem>
                <SelectItem value="gallinero-2">Gallinero 2</SelectItem>
              </SelectContent>
            </Select>
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
        </div>
      </main>
    </div>
  );
}
