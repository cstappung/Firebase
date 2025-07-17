"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getEggsPerHour } from "@/lib/data";
import { BarChart as BarChartIcon, Download, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const chartConfig = {
  eggs: {
    label: "Huevos",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

interface EggsPerHourChartProps {
    henhouse: string;
}

export function EggsPerHourChart({ henhouse }: EggsPerHourChartProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [chartData, setChartData] = useState(getEggsPerHour(henhouse, date?.from, date?.to));

  useEffect(() => {
    if (date?.from && date?.to) {
        setChartData(getEggsPerHour(henhouse, date.from, date.to));
    }
  }, [date, henhouse]);


  const handleDownload = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "day,hour,eggs\n" +
      chartData.map((d) => d.data.map((e) => `${d.date},${e.hour},${e.eggs}`).join("\n")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "produccion_por_hora.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const flattenedData = chartData.flatMap(d => d.data.map(h => ({ name: `${d.date} ${h.hour}`, eggs: h.eggs })));

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 font-bold">
            <BarChartIcon className="h-5 w-5" />
            Producción por Hora
          </CardTitle>
          <CardDescription>
            Producción total de huevos por cada hora de la jornada.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-[280px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                        {format(date.to, "LLL dd, y", { locale: es })}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y", { locale: es })
                    )
                  ) : (
                    <span>Selecciona un rango</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Descargar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={flattenedData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10 }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={5} />
            <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="eggs" fill="var(--color-eggs)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
