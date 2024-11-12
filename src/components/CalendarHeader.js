import dayjs from "dayjs";
import React, { useContext } from "react";
import logo from "../assets/logo.png";
import GlobalContext from "../context/GlobalContext";

export default function CalendarHeader() {
  const { monthIndex, setMonthIndex, year, setYear, viewMode, setViewMode, setDaySelected } = useContext(GlobalContext);

  function handleReset() {
    const today = dayjs();
    setDaySelected(today);
    setMonthIndex(today.month());
    setYear(today.year());
  }

  function toggleViewMode() {
    if (viewMode === "month") {
      setViewMode("day");
    } else if (viewMode === "day") {
      setViewMode("week");
    } else {
      setViewMode("month");
    }
  }

  return (
    <header className="px-4 py-2 flex items-center justify-between z-40">
      <div className="flex items-center">
        <img src={logo} alt="calendar" className="mr-2 w-12 h-12" />
        <h1 className="mr-16 text-xl text-gray-500 font-bold">Calendar</h1>
        <h2 className="ml-10 text-xl text-gray-500 font-bold mr-4">
          {dayjs(new Date(year, monthIndex)).format("MMMM YYYY")}
        </h2>
        <button
          onClick={handleReset}
          className="border rounded py-2 px-4 mr-5 ml-5"
        >
          Today
        </button>
      </div>
      <button
        onClick={toggleViewMode}
        className="border rounded py-2 px-4 mr-5 ml-1 flex items-center"
      >
        {viewMode === "month" ? (
          <span className="material-icons">view_day</span>
        ) : viewMode === "day" ? (
          <span className="material-icons">view_week</span>
        ) : (
          <span className="material-icons">calendar_view_month</span>
        )}
      </button>
    </header>
  );
}