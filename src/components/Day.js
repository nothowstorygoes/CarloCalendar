import dayjs from "dayjs";
import "dayjs/locale/it"; // Import Italian locale
import React, { useContext, useEffect, useState } from "react";
import GlobalContext from "../context/GlobalContext";

export default function Day({ day, rowIdx, currentMonthIdx, year, roundedClass }) {
  const [dayEvents, setDayEvents] = useState([]);
  const {
    setDaySelected,
    filteredEvents,
    setSelectedEvent,
    setViewMode,
    labels,
  } = useContext(GlobalContext);

  useEffect(() => {
    const events = filteredEvents.filter(
      (evt) =>
        dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
    );
    setDayEvents(events);
  }, [filteredEvents, day]);

  function getCurrentDayClass() {
    return day.format("DD-MM-YY") === dayjs().format("DD-MM-YY")
      ? "bg-blue-600 text-white rounded-full w-6 h-4 flex items-center justify-center"
      : "";
  }

  function getDayClass() {
    if (day.month() !== currentMonthIdx) {
      return "text-gray-400"; // Grey out days not in the current month
    } else {
      return "";
    }
  }

  const getLabelColor = (labelName) => {
    const label = labels.find((lbl) => lbl.name === labelName);
    return label ? label.color : "gray";
  };

  const displayEvents = dayEvents.slice(0, 2);


  return (
    <div
      className={`transition-shadow duration-300 ease-in-out hover:shadow-2xl border border-gray-200 dark:border-zinc-700 flex flex-col ${getDayClass()} ${roundedClass}`}
      onClick={() => {
        setDaySelected(day);
        setViewMode("day");
      }}
    >
      <header className="flex flex-col items-center cursor-pointer">
        {rowIdx === 0 && (
          <p className="text-xs mt-1 text-gray-500 dark:text-zinc-50">
            {day.format("ddd").toUpperCase()}
          </p>
        )}
        <p
          className={`dark:text-white text-xs p-1 my-1 text-center ${getCurrentDayClass()}`}
        >
          {day.format("DD")}
        </p>
      </header>
      <div className="flex-1">
        {displayEvents.map((evt, idx) => (
          <div
            key={idx}
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the modal when clicking on an event
              setSelectedEvent(evt);
            }}
            className="p-1 mx-1 text-xs rounded mb-1 truncate text-center font-bold"
            style={{ backgroundColor: evt.checked ? "rgba(128, 128, 128, 0.8)" : `${getLabelColor(evt.label)}80` , color: "black" }}
          >
            {evt.title}
          </div>
        ))}
      </div>
    </div>
  );
}