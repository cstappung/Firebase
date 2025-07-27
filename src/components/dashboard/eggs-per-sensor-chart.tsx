"use client";

import { useState, useEffect } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
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
import { subscribeToEggsPerSensor, getSensorNames } from "@/lib/data";
import { BarChart as BarChartIcon, Download, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "../ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

const startHourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
});

const endHourOptions = [...startHourOptions.slice(1), "24:00"];

interface EggsPerSensorChartProps {
    henhouse: string;
}

const SENSOR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
];

export function EggsPerSensorChart({ henhouse }: EggsPerSensorChartProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [startHour, setStartHour] = useState('00:00');
  const [endHour, setEndHour] = useState('24:00');
  const [availableSensors, setAvailableSensors] = useState<string[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});

  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
  }, []);

  useEffect(() => {
    async function fetchSensors() {
        const henhouseId = henhouse === 'all' ? 'Pabellon_1' : `Pabellon_${henhouse.split('-')[1]}`;
        const names = await getSensorNames(henhouseId);
        setAvailableSensors(names);
        setSelectedSensors(names); // Select all by default
    }
    if (henhouse) {
        fetchSensors();
    }
  }, [henhouse]);

  useEffect(() => {
    if (!isClient || !startDate || !endDate || availableSensors.length === 0) return;

    setLoading(true);

    const newChartConfig: ChartConfig = availableSensors.reduce((config, sensorName, index) => {
        config[sensorName] = {
            label: sensorName,
            color: SENSOR_COLORS[index % SENSOR_COLORS.length],
        };
        return config;
    }, {} as ChartConfig);
    setChartConfig(newChartConfig);

    const unsubscribe = subscribeToEggsPerSensor(
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

    return () => unsubscribe();
  }, [startDate, endDate, henhouse, startHour, endHour, isClient, availableSensors]);

  const handleSensorSelection = (sensor: string) => {
    setSelectedSensors(prev => 
        prev.includes(sensor) ? prev.filter(s => s !== sensor) : [...prev, sensor]
    );
  };
  
  const handleDownload = () => {
    if (chartData.length === 0) return;

    const header = ["time", ...availableSensors].join(",");
    const rows = chartData.map(row => {
        const time = row.name;
        const sensorValues = availableSensors.map(sensor => row[sensor] || 0).join(",");
        return `${time},${sensorValues}`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "produccion_por_sensor.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isClient) {
    return <Card className="shadow-lg"><CardContent><Skeleton className="h-[400px] w-full" /></CardContent></Card>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-row items-start justify-between">
            <div>
            <CardTitle className="flex items-center gap-2 font-bold">
                <BarChartIcon className="h-5 w-5" />
                Producción por Sensor
            </CardTitle>
            <CardDescription>
                Producción de huevos registrada por cada sensor.
            </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleDownload} disabled={loading || chartData.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
            </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full flex-1 min-w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "LLL dd, y", { locale: es }) : <span>Fecha de inicio</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={es} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full flex-1 min-w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "LLL dd, y", { locale: es }) : <span>Fecha de fin</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} />
              </PopoverContent>
            </Popover>
            <div className="flex gap-2 w-full sm:w-auto">
                 <Select value={startHour} onValueChange={setStartHour}>
                    <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Inicio" /></SelectTrigger>
                    <SelectContent>{startHourOptions.map(hour => <SelectItem key={`start-${hour}`} value={hour}>{hour}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={endHour} onValueChange={setEndHour}>
                    <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Fin" /></SelectTrigger>
                    <SelectContent>{endHourOptions.map(hour => <SelectItem key={`end-${hour}`} value={hour}>{hour}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>
         <div className="mt-4 flex flex-wrap items-center gap-4">
            {availableSensors.map(sensor => (
                <div key={sensor} className="flex items-center space-x-2">
                    <Checkbox
                        id={`sensor-${sensor}`}
                        checked={selectedSensors.includes(sensor)}
                        onCheckedChange={() => handleSensorSelection(sensor)}
                    />
                    <Label htmlFor={`sensor-${sensor}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {sensor}
                    </Label>
                </div>
            ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex h-[250px] w-full items-center justify-center">
                <Skeleton className="h-full w-full" />
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={5} allowDecimals={false} />
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Legend />
                {selectedSensors.map(sensor => (
                    <Line key={sensor} dataKey={sensor} stroke={`var(--color-${sensor})`} strokeWidth={2} dot={false} />
                ))}
            </LineChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
