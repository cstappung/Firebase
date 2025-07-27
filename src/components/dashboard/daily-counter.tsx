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
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DailyCounterProps {
  henhouse: string;
}

export function DailyCounter({ henhouse }: DailyCounterProps) {
  const [count, setCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    // For simplicity, we'll just show Pabellon_1 for "all". 
    const henhouseId = henhouse === 'all' ? 'Pabellon_1' : `Pabellon_${henhouse.split('-')[1]}`;
    
    const dateStr = format(selectedDate, 'dd-MM-yyyy');

    const dataRef = ref(database, henhouseId);
    
    // This is a simple listener. For a large dataset, you'd want a more optimized query.
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const allData = snapshot.val();
        let dailyTotal = 0;
        
        Object.keys(allData).forEach(key => {
          // Key is like Pabellon_1-17-07-2025-03-33
          if (key.includes(dateStr)) {
            const entry = allData[key];
            const entryTotal = Object.values(entry as Record<string, number>).reduce((sum, val) => sum + val, 0);
            dailyTotal += entryTotal;
          }
        });
        setCount(dailyTotal);
      } else {
        setCount(0);
      }
    }, () => {
      // On error or permission denied
      setCount(0);
    });

    return () => unsubscribe();
  }, [henhouse, selectedDate]);

  if (!isClient) {
    return null;
  }

  const formatDateTitle = (date: Date | undefined) => {
    if (!date) return "Seleccione un día";
    const today = new Date();
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return "Hoy";
    }
    return format(date, "d 'de' LLLL 'de' yyyy", { locale: es });
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <EggIcon className="h-6 w-6 text-primary" />
              <span>Huevos Recolectados</span>
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full sm:w-[280px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? formatDateTitle(selectedDate) : <span>Seleccione un día</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
        </div>
        <CardDescription>El contador se actualiza en tiempo real desde Firebase.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-6xl font-bold text-primary transition-all duration-300">
          {count.toLocaleString("es-ES")}
        </p>
      </CardContent>
    </Card>
  );
}
