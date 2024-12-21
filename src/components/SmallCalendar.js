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

  function handlePrevMonth() {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear(year - 1);
    } else {
      setMonthIndex(monthIndex - 1);
    }
  }

  function handleNextMonth() {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear(year + 1);
    } else {
      setMonthIndex(monthIndex + 1);
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
    <div className="mt-9">
      <header className="flex justify-between">
        <p className="text-gray-500 dark:text-zinc-50 font-bold">
          {capitalizeFirstLetter(dayjs(new Date(year, monthIndex)).format("MMMM YYYY"))}
        </p>
        <div>
          <button onClick={handlePrevMonth}>
            <span className="material-icons-outlined cursor-pointer text-gray-600 dark:text-zinc-50 mx-2">
              chevron_left
            </span>
          </button>
          <button onClick={handleNextMonth}>
            <span className="material-icons-outlined cursor-pointer text-gray-600 dark:text-zinc-50 mx-2">
              chevron_right
            </span>
          </button>
        </div>
      </header>
      <div className="grid grid-cols-7 grid-rows-6">
        {currentMonth[0].map((day, i) => (
          <span key={i} className="text-sm py-1 text-center text-gray-500 dark:text-zinc-50">
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
                <span className="text-sm text-gray-600 dark:text-zinc-50">{day.format("D")}</span>
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}