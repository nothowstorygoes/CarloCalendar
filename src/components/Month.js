import React, { useContext, useEffect, useState } from "react";
import GlobalContext from "../context/GlobalContext";
import { getMonth } from "../util";
import Day from "./Day";

export default function Month() {
  const { monthIndex, year, filteredEvents } = useContext(GlobalContext);
  const [currentMonth, setCurrentMonth] = useState(getMonth(monthIndex, year));

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex, year));
  }, [monthIndex, year]);

  useEffect(() => {
    // Update the current month when filtered events change
  }, [filteredEvents]);

  return (
    <div className="h-[calc(100%-2rem)] w-[calc(100%-1.5rem)] rounded-3xl left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950 mr-6">
      <div className="bg-white dark:bg-zinc-950 w-full h-full max-w-none max-h-none overflow-hidden relative rounded-3xl">
        <div className="w-full h-full flex-1 grid grid-cols-7 grid-rows-6 bg-white dark:bg-zinc-950 rounded-3xl">
          {currentMonth.map((row, i) => (
            <React.Fragment key={i}>
              {row.map((day, idx) => {
                let roundedClass = "";
                if (i === 0 && idx === 0) roundedClass = "rounded-tl-3xl";
                if (i === 0 && idx === 6) roundedClass = "rounded-tr-3xl";
                if (i === currentMonth.length - 1 && idx === 0) roundedClass = "rounded-bl-3xl";
                if (i === currentMonth.length - 1 && idx === 6) roundedClass = "rounded-br-3xl";

                return (
                  <Day
                    day={day}
                    key={idx}
                    rowIdx={i}
                    currentMonthIdx={monthIndex}
                    year={year}
                    roundedClass={roundedClass}
                    events={filteredEvents}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}