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
    <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-white dark:bg-gray-900">
      {currentMonth.map((row, i) => (
        <React.Fragment key={i}>
          {row.map((day, idx) => (
            <Day day={day} key={idx} rowIdx={i} currentMonthIdx={monthIndex} year={year} />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}