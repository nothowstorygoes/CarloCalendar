import dayjs from "dayjs";
import "dayjs/locale/it"; // Import Italian locale
import React, { useContext, useEffect, useState } from "react";
import GlobalContext from "../context/GlobalContext";
import { getMonth } from "../util";
import { useTranslation } from 'react-i18next';

export default function SmallCalendar() {
  const { t } = useTranslation();
  const { monthIndex, setMonthIndex, year, setYear, setSmallCalendarMonth, setDaySelected, setViewMode, daySelected } = useContext(GlobalContext);
  const [currentMonth, setCurrentMonth] = useState(getMonth(monthIndex, year));

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex, year));
  }, [monthIndex, year]);

  useEffect(() => {
    dayjs.locale('it'); // Set dayjs locale to Italian
  }, []);

  function handleNextMonth() {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear(year + 1);
    } else {
      setMonthIndex(monthIndex + 1);
    }
  }

  function handlePrevMonth() {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear(year - 1);
    } else {
      setMonthIndex(monthIndex - 1);
    }
  }

  function getDayClass(day) {
    const format = "DD-MM-YY";
    const nowDay = dayjs().format(format);
    const currDay = day.format(format);
    const slcDay = daySelected && daySelected.format(format);
    if (nowDay === currDay) {
      return "bg-blue-500 rounded-full text-white";
    } else if (currDay === slcDay) {
      return "bg-blue-100 dark:bg-blue-700 rounded-full text-blue-600 dark:text-blue-200 font-bold";
    } else if (day.month() !== monthIndex) {
      return "text-gray-400"; // Grey out days from past month
    } else {
      return "";
    }
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return (
    <div className="mt-12">
      <header className="flex justify-between">
        <p className="text-gray-500 dark:text-zinc-50 font-bold text-sm mb-4">
          {capitalizeFirstLetter(dayjs(new Date(year, monthIndex)).locale("it").format("MMMM YYYY"))}
        </p>
        <div>
          <button onClick={handlePrevMonth} className="material-icons text-gray-500 dark:text-zinc-50">chevron_left</button>
          <button onClick={handleNextMonth} className="material-icons text-gray-500 dark:text-zinc-50">chevron_right</button>
        </div>
      </header>
      <div className="grid grid-cols-7 grid-rows-6 text-sm">
        {currentMonth[0].map((day, i) => (
          <span key={i} className="text-center text-gray-500 dark:text-zinc-50">
            {capitalizeFirstLetter(day.format("dd").charAt(0))}
          </span>
        ))}
        {currentMonth.map((row, i) => (
          <React.Fragment key={i}>
            {row.map((day, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSmallCalendarMonth(monthIndex);
                  setDaySelected(day);
                  setViewMode("day");
                }}
                className={`py-1 w-full ${getDayClass(day)}`}
              >
                <span className={`text-sm ${day.month() !== monthIndex ? 'text-gray-400' : 'text-gray-600 dark:text-zinc-50'}`}>
                  {day.format("D")}
                </span>
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}