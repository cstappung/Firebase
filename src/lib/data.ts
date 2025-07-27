import {
  format,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  parse,
  isWithinInterval,
  setHours,
  setMinutes,
  setSeconds,
  eachHourOfInterval,
  eachMinuteOfInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { database } from './firebase';
import {
  ref,
  get,
  query,
  orderByKey,
  startAt,
  endAt,
  onValue,
  off,
  limitToFirst,
} from 'firebase/database';

export async function getHenhouseNames(): Promise<string[]> {
  const dbRef = ref(database); // Reference to the root
  try {
    const snapshot = await get(query(dbRef));
    if (snapshot.exists()) {
      const allKeys = Object.keys(snapshot.val());
      return allKeys.filter(key => key.startsWith("Pabellon_"));
    }
    return [];
  } catch (error) {
    console.error('Error fetching henhouse names:', error);
    return [];
  }
}

export async function getSensorNames(henhouseId: string): Promise<string[]> {
    const dataRef = ref(database, henhouseId);
    const q = query(dataRef, orderByKey(), limitToFirst(1));
    try {
        const snapshot = await get(q);
        if (snapshot.exists()) {
            const firstRecord = snapshot.val();
            const recordKey = Object.keys(firstRecord)[0];
            const sensors = firstRecord[recordKey];
            return Object.keys(sensors);
        }
        return [];
    } catch (error) {
        console.error("Error fetching sensor names:", error);
        return [];
    }
}

export function getFirebaseData(
  henhouse: string,
  startDate: Date,
  endDate: Date,
  startHour: string,
  endHour: string,
  callback: (data: { date: Date; eggs: number; sensors: Record<string, number> }[]) => void
) {
  const henhouseId =
    henhouse === 'all' || !henhouse.includes('-')
      ? 'Pabellon_1'
      : `Pabellon_${henhouse.split('-')[1]}`;

  const dataRef = ref(database, henhouseId);

  const startKey = `${henhouseId}-${format(startDate, 'dd-MM-yyyy')}`;
  const endKey = `${henhouseId}-${format(endDate, 'dd-MM-yyyy')}-23-59`;

  const dataQuery = query(dataRef, orderByKey(), startAt(startKey), endAt(endKey));

  const listener = onValue(
    dataQuery,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const [startH, startM] = startHour.split(':').map(Number);
      const [endH, endM] = endHour.split(':').map(Number);

       const preciseStartDate = setSeconds(
        setMinutes(setHours(startOfDay(startDate), startH), startM),
        0
      );

      let preciseEndDate;
      if (endHour === "24:00") {
        preciseEndDate = endOfDay(endDate);
      } else {
        preciseEndDate = setSeconds(
          setMinutes(setHours(startOfDay(endDate), endH), endM),
          59
        );
      }

      const allData = snapshot.val();
      const filteredData = Object.entries(allData)
        .map(([key, value]) => {
          const parts = key.split('-');
          if (parts.length < 5) return null;

          const dateStr = `${parts[1]}-${parts[2]}-${parts[3]} ${parts[4]}:${
            parts[5] || '00'
          }`;
          try {
            const recordDate = parse(dateStr, 'dd-MM-yyyy HH:mm', new Date());
            const sensorData = value as Record<string, number>;
            const totalEggs = Object.values(sensorData).reduce((sum, count) => sum + count, 0);

            return {
              date: recordDate,
              eggs: totalEggs,
              sensors: sensorData,
            };
          } catch (error) {
            console.error('Error parsing date from key:', key, error);
            return null;
          }
        })
        .filter((item) => {
          if (!item) return false;
          return isWithinInterval(item.date, {
            start: preciseStartDate,
            end: preciseEndDate,
          });
        });

      // @ts-ignore - TS doesn't know we filtered out nulls
      const sortedData = filteredData.sort((a, b) => a.date.getTime() - b.date.getTime());
      callback(sortedData);
    },
    (error) => {
      console.error('Firebase read failed: ' + error.code);
      callback([]);
    }
  );

  // Return a function to unsubscribe from the listener
  return () => off(dataQuery, 'value', listener);
}

const processDataForCharts = (
  rawData: { date: Date; eggs: number }[],
  startDate: Date,
  endDate: Date,
  startHour: string,
  endHour: string,
  intervalType: 'minute' | 'hour'
) => {
  const [startH, startM] = startHour.split(':').map(Number);
  
  const preciseStartDate = setSeconds(setMinutes(setHours(startOfDay(startDate), startH), startM), 0);

  let preciseEndDate;
    if (endHour === "24:00") {
      preciseEndDate = endOfDay(endDate);
    } else {
      const [endH, endM] = endHour.split(':').map(Number);
      preciseEndDate = setSeconds(
        setMinutes(setHours(startOfDay(endDate), endH), endM),
        0
      );
    }


  if (intervalType === 'minute') {
    const dataByMinute = rawData.reduce((acc, item) => {
      const minuteKey = format(item.date, 'yyyy-MM-dd-HH-mm');
      acc[minuteKey] = (acc[minuteKey] || 0) + item.eggs;
      return acc;
    }, {} as Record<string, number>);

    const allMinutes = eachMinuteOfInterval({
      start: preciseStartDate,
      end: preciseEndDate,
    });

    const minuteData = allMinutes.map((minute) => {
      const minuteKey = format(minute, 'yyyy-MM-dd-HH-mm');
      return {
        name: format(minute, 'dd/MM HH:mm'),
        eggs: dataByMinute[minuteKey] || 0,
      };
    });

    const groupedByDay = minuteData.reduce((acc, curr) => {
      const day = curr.name.split(' ')[0];
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push({ time: curr.name.split(' ')[1], eggs: curr.eggs });
      return acc;
    }, {} as Record<string, { time: string; eggs: number }[]>);

    return Object.entries(groupedByDay).map(([date, data]) => ({
      date: format(parse(date, 'dd/MM', new Date()), 'd MMM', { locale: es }),
      data,
    }));
  }

  if (intervalType === 'hour') {
      const dataByHour = rawData.reduce((acc, item) => {
        const hourKey = format(item.date, 'yyyy-MM-dd-HH');
        acc[hourKey] = (acc[hourKey] || 0) + item.eggs;
        return acc;
      }, {} as Record<string, number>);

      const allHours = eachHourOfInterval({
          start: preciseStartDate,
          end: preciseEndDate
      });

      const hourlyData = allHours.map(hour => {
          const hourKey = format(hour, 'yyyy-MM-dd-HH');
          return {
              name: format(hour, 'dd/MM HH:00'),
              eggs: dataByHour[hourKey] || 0,
          };
      });

      const groupedByDay = hourlyData.reduce((acc, curr) => {
        const day = curr.name.split(' ')[0];
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push({ hour: curr.name.split(' ')[1], eggs: curr.eggs });
        return acc;
      }, {} as Record<string, { hour: string; eggs: number }[]>);
    
      return Object.entries(groupedByDay).map(([date, data]) => ({
          date: format(parse(date, 'dd/MM', new Date()), "d MMM", { locale: es }),
          data
      }));
  }
  return [];
};


export const subscribeToEggsPerMinute = (
  henhouse: string,
  startDate: Date,
  endDate: Date,
  startHour: string,
  endHour: string,
  callback: (data: any) => void
) => {
    return getFirebaseData(henhouse, startDate, endDate, startHour, endHour, (rawData) => {
        const processedData = processDataForCharts(rawData, startDate, endDate, startHour, endHour, 'minute');
        callback(processedData);
    });
};

export const subscribeToEggsPerHour = (
  henhouse: string,
  startDate: Date,
  endDate: Date,
  startHour: string,
  endHour: string,
  callback: (data: any) => void
) => {
    return getFirebaseData(henhouse, startDate, endDate, startHour, endHour, (rawData) => {
        const processedData = processDataForCharts(rawData, startDate, endDate, startHour, endHour, 'hour');
        callback(processedData);
    });
};

export const subscribeToEggsPerSensor = (
  henhouse: string,
  startDate: Date,
  endDate: Date,
  startHour: string,
  endHour: string,
  callback: (data: any) => void
) => {
    return getFirebaseData(henhouse, startDate, endDate, startHour, endHour, (rawData) => {
      const dataByTime = rawData.reduce((acc, item) => {
          const timeKey = format(item.date, 'yyyy-MM-dd-HH-mm');
          if (!acc[timeKey]) {
              acc[timeKey] = { name: format(item.date, 'dd/MM HH:mm'), ...item.sensors };
          } else {
              Object.keys(item.sensors).forEach(sensor => {
                  acc[timeKey][sensor] = (acc[timeKey][sensor] || 0) + item.sensors[sensor];
              });
          }
          return acc;
      }, {} as Record<string, any>);

      const processedData = Object.values(dataByTime);
      callback(processedData);
    });
};