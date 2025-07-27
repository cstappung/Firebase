"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { database } from "@/lib/firebase";
import { ref, onValue, query, orderByKey, limitToLast } from "firebase/database";
import { ListTree } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface SystemLogsProps {
  henhouse: string;
}

interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
  henhouseName: string;
}

export function SystemLogs({ henhouse }: SystemLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const logRef = ref(database, "LOG");
    
    // Query to get the last 100 logs to avoid performance issues.
    const logQuery = query(logRef, orderByKey(), limitToLast(100));

    const unsubscribe = onValue(logQuery, (snapshot) => {
      if (snapshot.exists()) {
        const allLogs = snapshot.val();
        
        const parsedLogs = Object.entries(allLogs)
          .map(([key, value]: [string, any]) => {
            const parts = key.split('-');
            const henhouseName = parts[0];
            const date = parts.slice(1,4).join('-');
            const time = parts.slice(4).join(':');

            return {
              id: key,
              message: value.Log || "Mensaje de log no válido.",
              timestamp: `${date} ${time}`,
              henhouseName: henhouseName,
            };
          })
          .reverse(); // Show most recent logs first

        setLogs(parsedLogs);
      } else {
        setLogs([]);
      }
      setLoading(false);
    }, () => {
        setLogs([]);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const henhouseNumber = henhouse === 'all' ? null : henhouse.split('-')[1];

  const filteredLogs = henhouseNumber
    ? logs.filter(log => log.henhouseName.endsWith(`_${henhouseNumber}`))
    : logs;

  const formatLogMessage = (log: LogEntry) => {
    // Pabellon_6-23-07-2025-23-42 -> Pabellón 6 (23-07-2025 23:42)
    const nameParts = log.henhouseName.split('_');
    const formattedName = `Pabellón ${nameParts[1]}`;
    return `${formattedName} (${log.timestamp}): ${log.message}`;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold">
          <ListTree className="h-5 w-5" />
          Logs del Sistema
        </CardTitle>
        <CardDescription>
          Últimos eventos registrados por los equipos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
             </div>
        ) : (
            <ScrollArea className="h-72 w-full rounded-md border p-4 font-mono text-sm">
            {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => <p key={log.id}>{formatLogMessage(log)}</p>)
            ) : (
                <p className="text-muted-foreground">No hay logs para mostrar.</p>
            )}
            </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
