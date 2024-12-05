import React, { useContext, useEffect, useState } from "react";
import Day from "./Day";
import GlobalContext from "../context/GlobalContext";
import { getMonth } from "../util";

export default function Month() {
  const { monthIndex, year } = useContext(GlobalContext);
  const [currentMonth, setCurrentMonth] = useState(getMonth(monthIndex, year));

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex, year));
  }, [monthIndex, year]);

  return (
    <div className="mb-5 mr-5 flex-1 grid grid-cols-7 grid-rows-5 bg-white dark:bg-zinc-950 rounded-3xl">
      {currentMonth.map((row, i) => (
        <React.Fragment key={i}>
          {row.map((day, idx) => {
            // Determine the classes for the corners
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
              />
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}