import dayjs from "dayjs";

export function getMonth(month = dayjs().month(), year = dayjs().year()) {
  month = Math.floor(month);
  const firstDayOfTheMonth = dayjs(new Date(year, month, 1)).day();
  const adjustedFirstDay = (firstDayOfTheMonth + 6) % 7; // Adjust to start from Monday
  let currentMonthCount = 0 - adjustedFirstDay;
  const daysMatrix = new Array(6).fill([]).map(() => {
    return new Array(7).fill(null).map(() => {
      currentMonthCount++;
      return dayjs(new Date(year, month, currentMonthCount));
    });
  });
  return daysMatrix;
}

export function getWeeks(month = dayjs().month(), year = dayjs().year()) {
  const daysMatrix = getMonth(month, year);
  return daysMatrix.map(week => week);
}