"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
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
import { subscribeToEggsPerMinute } from "@/lib/data";
import { Activity, Download, Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "../ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const chartConfig = {
  eggs: {
    label: "Huevos",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface EggsPerMinuteChartProps {
    henhouse: string;
}

type ChartData = Awaited<ReturnType<typeof subscribeToEggsPerMinute>>;

const startHourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
});

const endHourOptions = [...startHourOptions.slice(1), "24:00"];


export function EggsPerMinuteChart({ henhouse }: EggsPerMinuteChartProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [chartData, setChartData] = useState<ChartData>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [startHour, setStartHour] = useState('00:00');
  const [endHour, setEndHour] = useState('24:00');

  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
  }, []);

  useEffect(() => {
    if (!isClient || !startDate || !endDate) return;

    setLoading(true);

    const unsubscribe = subscribeToEggsPerMinute(
      henhouse,
      startDate,
      endDate,
      startHour,
      endHour,
      (data) => {
        setChartData(data);
        setLoading(false);
      }
    );

    // Cleanup subscription on component unmount or when dependencies change
    return () => unsubscribe();
  }, [startDate, endDate, henhouse, startHour, endHour, isClient]);

  const handleDownload = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "day,time,eggs\n" +
      chartData.map((d: any) => d.data.map((m: any) => `${d.date},${m.time},${m.eggs}`).join("\n")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "produccion_por_minuto.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const flattenedData = chartData.flatMap((d: any) => d.data.map((m: any) => ({ name: `${d.date} ${m.time}`, eggs: m.eggs })));

  if (!isClient) {
    return (
        <Card className="shadow-lg">
             <CardHeader>
                <div className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 font-bold">
                            <Activity className="h-5 w-5" />
                            Huevos por Minuto
                        </CardTitle>
                        <CardDescription>Producción de huevos por minuto.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex h-[250px] w-full items-center justify-center">
                    <Skeleton className="h-full w-full" />
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-row items-start justify-between">
            <div>
            <CardTitle className="flex items-center gap-2 font-bold">
                <Activity className="h-5 w-5" />
                Huevos por Minuto
            </CardTitle>
            <CardDescription>Producción de huevos por minuto.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleDownload} disabled={loading || flattenedData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Descargar
            </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full flex-1 min-w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "LLL dd, y", { locale: es }) : <span>Fecha de inicio</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full flex-1 min-w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "LLL dd, y", { locale: es }) : <span>Fecha de fin</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
           <div className="flex gap-2 w-full sm:w-auto">
                <Select value={startHour} onValueChange={setStartHour}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                        <SelectValue placeholder="Inicio" />
                    </SelectTrigger>
                    <SelectContent>
                        {startHourOptions.map(hour => <SelectItem key={`start-${hour}`} value={hour}>{hour}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={endHour} onValueChange={setEndHour}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                        <SelectValue placeholder="Fin" />
                    </SelectTrigger>
                    <SelectContent>
                        {endHourOptions.map(hour => <SelectItem key={`end-${hour}`} value={hour}>{hour}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex h-[250px] w-full items-center justify-center">
                <Skeleton className="h-full w-full" />
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart
                data={flattenedData}
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
                tickCount={6}
                allowDecimals={false}
                />
                <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                dataKey="eggs"
                type="monotone"
                stroke="var(--color-eggs)"
                strokeWidth={3}
                dot={true}
                />
            </LineChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
