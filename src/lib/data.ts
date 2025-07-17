import { format, eachDayOfInterval, addDays } from "date-fns";
import { es } from "date-fns/locale";

const getHenhouseMultiplier = (henhouse: string) => {
    switch (henhouse) {
        case 'gallinero-1':
            return 0.5;
        case 'gallinero-2':
            return 0.5;
        default:
            return 1;
    }
}

export const getEggsPerMinute = (henhouse: string, startDate?: Date, endDate?: Date) => {
  if (!startDate || !endDate) {
    return [];
  }
  const interval = eachDayOfInterval({ start: startDate, end: endDate });
  const multiplier = getHenhouseMultiplier(henhouse);

  return interval.map((day) => {
    const data = [];
    const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
    const now = isToday ? new Date() : addDays(day, 1);
    
    const maxMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 24 * 60;
    const startMinute = Math.max(0, maxMinutes - 10);


    for (let i = startMinute; i < maxMinutes; i++) {
        const timePoint = new Date(day.setHours(0,0,0,0) + i * 60000);
        data.push({
            time: timePoint.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            eggs: Math.floor((Math.floor(Math.random() * (25 - 10 + 1)) + 10) * multiplier),
        });
    }

    // Only show last 10 minutes for today
    if (isToday) {
        return {
            date: format(day, "d MMM", { locale: es }),
            data: data.slice(-10)
        }
    }

    return {
      date: format(day, "d MMM", { locale: es }),
      data: data.filter((_, index) => index % 60 === 0), // Sample every hour for past days
    };
  });
};

export const getEggsPerHour = (henhouse: string, startDate?: Date, endDate?: Date) => {
  if (!startDate || !endDate) {
    return [];
  }
  const interval = eachDayOfInterval({ start: startDate, end: endDate });
  const multiplier = getHenhouseMultiplier(henhouse);

  return interval.map((day) => {
    return {
      date: format(day, "d MMM", { locale: es }),
      data: [
        { hour: "8am", eggs: Math.floor((Math.floor(Math.random() * 200) + 800) * multiplier) },
        { hour: "9am", eggs: Math.floor((Math.floor(Math.random() * 200) + 900) * multiplier) },
        { hour: "10am", eggs: Math.floor((Math.floor(Math.random() * 200) + 1100) * multiplier) },
        { hour: "11am", eggs: Math.floor((Math.floor(Math.random() * 200) + 1000) * multiplier) },
        { hour: "12pm", eggs: Math.floor((Math.floor(Math.random() * 200) + 1200) * multiplier) },
        { hour: "1pm", eggs: Math.floor((Math.floor(Math.random() * 200) + 1150) * multiplier) },
        { hour: "2pm", eggs: Math.floor((Math.floor(Math.random() * 200) + 950) * multiplier) },
        { hour: "3pm", eggs: Math.floor((Math.floor(Math.random() * 200) + 1050) * multiplier) },
      ],
    };
  });
};
