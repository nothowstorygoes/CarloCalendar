import React, { useContext, useEffect, useState } from "react";
import GlobalContext from "../context/GlobalContext";
import { getMonth } from "../util";
import dayjs from "dayjs";
import "dayjs/locale/it"; // Import Italian locale
import { useTranslation } from 'react-i18next';

function SmallCalendarYearView({ monthIndex, year }) {
    const { t } = useTranslation();
    const { setDaySelected, setViewMode, daySelected } = useContext(GlobalContext);
    const [currentMonth, setCurrentMonth] = useState(getMonth(monthIndex, year));
  
    useEffect(() => {
      setCurrentMonth(getMonth(monthIndex, year));
    }, [monthIndex, year]);
  
    useEffect(() => {
      dayjs.locale('it'); // Set dayjs locale to Italian
    }, []);
  
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
      <div className="mt-2">
        <header className="flex justify-between">
          <p className="text-gray-500 dark:text-zinc-50 font-bold text-xs">
            {capitalizeFirstLetter(dayjs(new Date(year, monthIndex)).locale("it").format("MMMM YYYY"))}
          </p>
        </header>
        <div className="grid grid-cols-7 grid-rows-6 text-xs">
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
                    setDaySelected(day);
                    setViewMode("day");
                  }}
                  className={`py-1 w-full ${getDayClass(day)}`}
                >
                  <span className={`text-xs ${day.month() !== monthIndex ? 'text-gray-400' : 'text-gray-600 dark:text-zinc-50'}`}>
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
  

export default function YearView() {
  const { year } = useContext(GlobalContext);
  const [currentYear, setCurrentYear] = useState([]);

  useEffect(() => {
    const months = Array.from({ length: 12 }, (_, i) => getMonth(i, year));
    setCurrentYear(months);
  }, [year]);

  return (
    <div className="h-[calc(100%-6rem)] w-[calc(100%-1.5rem)] rounded-3xl left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-950 w-full h-[calc(100%)] max-w-none max-h-none overflow-hidden relative rounded-3xl">
        <div className="mb-5 flex-1 grid grid-cols-4 grid-rows-3 gap-4 bg-white dark:bg-zinc-950 rounded-3xl p-4 overflow-auto">
          {currentYear.map((_, monthIndex) => (
            <div key={monthIndex} className="bg-white dark:bg-zinc-950 rounded-3xl p-2">
              <SmallCalendarYearView monthIndex={monthIndex} year={year} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}