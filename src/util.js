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

function formatDay(day) {
  return day.locale("en").format('ddd, D MMM, YYYY');
}

function getMonthWeeks(month, year) {
  const daysMatrix = getMonth(month, year);
  return daysMatrix.map(week => week.map(day => formatDay(day)));
}

export function getWeeksInInterval(startMonth, startYear, endMonth, endYear, startDate, endDate) {
  let currentMonth = startMonth;
  let currentYear = startYear;
  const formattedStartDate = dayjs(startDate).locale("en").format('ddd, D MMM, YYYY');
  const formattedEndDate = dayjs(endDate).locale("en").format('ddd, D MMM, YYYY');
  const weeksMatrix = [];

  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    const monthWeeks = getMonthWeeks(currentMonth, currentYear);
    weeksMatrix.push(...monthWeeks);

    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }

  console.log (startMonth, startYear, endMonth, endYear, formattedStartDate, formattedEndDate);
  console.log (weeksMatrix);
  // Remove duplicate rows
  const uniqueWeeksMatrix = weeksMatrix.filter((week, index, self) =>
    index === self.findIndex((w) => JSON.stringify(w) === JSON.stringify(week))
  );

  // Filter out weeks before the start date and after the end date
  const filteredWeeksMatrix = uniqueWeeksMatrix.filter(week => {
    const weekStartDate = dayjs(week[0], 'ddd, D MMM, YYYY');
    const weekEndDate = dayjs(week[week.length - 1], 'ddd, D MMM, YYYY');
    return weekEndDate.isAfter(dayjs(startDate).subtract(1, 'day')) && weekStartDate.isBefore(dayjs(endDate).add(1, 'day'));
  });

  return filteredWeeksMatrix;
}