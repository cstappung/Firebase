"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EggIcon } from "@/components/icons/egg-icon";

interface DailyCounterProps {
  henhouse: string;
}

export function DailyCounter({ henhouse }: DailyCounterProps) {
  const [count, setCount] = useState(24356);

  useEffect(() => {
    // Simulate fetching new count based on henhouse
    const baseCount = henhouse === 'all' ? 24356 : henhouse === 'gallinero-1' ? 12100 : 12256;
    setCount(baseCount);

    const interval = setInterval(() => {
      setCount((prevCount) => prevCount + Math.floor(Math.random() * 3) + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [henhouse]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <EggIcon className="h-6 w-6 text-primary" />
          <span>Huevos Recolectados Hoy</span>
        </CardTitle>
        <CardDescription>El contador se actualiza en tiempo real.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-6xl font-bold text-primary transition-all duration-300">
          {count.toLocaleString("es-ES")}
        </p>
      </CardContent>
    </Card>
  );
}
