"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { fetchEggsPerHour, HourlyGroup } from "@/lib/data";
import {
  BarChart as BarChartIcon,
  Download,
  Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
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
  const [chartData, setChartData] = useState<HourlyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date?.from || !date.to) return;

    setLoading(true);
    setError(null);

    fetchEggsPerHour(henhouse, date.from, date.to)
      .then((data) => {
        setChartData(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Error al leer datos de Firebase");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [henhouse, date]);

  // Aplanamos para Recharts: [{ name: "2025-07-17 14", eggs: 120 }, …]
  const flattened = chartData.flatMap((grp) =>
    grp.data.map((h) => ({
      name: `${grp.date} ${h.hour}`,
      eggs: h.eggs,
    }))
  );

  const handleDownload = () => {
    const header = "day,hour,eggs\n";
    const body = chartData
      .map((grp) =>
        grp.data
          .map((h) => `${grp.date},${h.hour},${h.eggs}`)
          .join("\n")
      )
      .join("\n");
    const csv = "data:text/csv;charset=utf-8," + header + body;
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", "produccion_por_hora.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 font-bold">
            <BarChartIcon className="h-5 w-5" />
            Producción por Hora
          </CardTitle>
          <CardDescription>
            Huevos totales por hora en el rango seleccionado.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
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
        {loading && <p>Cargando datos…</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
              data={flattened}
              margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickCount={5}
              />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="eggs" fill="var(--color-eggs)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
