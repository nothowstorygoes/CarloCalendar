import React, { useContext } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";
import logo from "../assets/logo.png";

export default function CalendarHeader() {
  const {
    monthIndex,
    setMonthIndex,
    year,
    setYear,
    viewMode,
    setViewMode,
    setDaySelected,
    setShowLabelEventsModal,
    toggleLabelManager,
  } = useContext(GlobalContext);

  function handleReset() {
    setMonthIndex(dayjs().month());
    setYear(dayjs().year());
    setDaySelected(dayjs());
  }

  function toggleViewMode() {
    if (viewMode === "month") {
      setViewMode("day");
    } else if (viewMode === "day") {
      setViewMode("week");
    } else {
      setViewMode("month");
    }
    setShowLabelEventsModal(false); // Hide LabelEventsView
    toggleLabelManager(false); // Hide LabelManager
  }

  return (
    <header className="px-4 py-2 flex items-center justify-between z-40 bg-white dark:bg-zinc-800">
      <div className="flex items-center ml-1">
        <img src={logo} alt="calendar" className="mr-2 w-12 h-12" />
        <h1 className="mr-16 text-xl text-gray-500 dark:text-zinc-50 font-bold">CarloCalendar</h1>
        <h2 className="ml-10 text-xl text-gray-500 dark:text-zinc-50 font-bold mr-4">
          {dayjs(new Date(year, monthIndex)).format("MMMM YYYY")}
        </h2>
        <button
          onClick={handleReset}
          className="border rounded py-2 px-4 mr-5 ml-5 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-50"
        >
          Today
        </button>
      </div>
      <button
        onClick={toggleViewMode}
        className="border rounded py-2 px-4 mr-5 ml-1 flex items-center bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-50"
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