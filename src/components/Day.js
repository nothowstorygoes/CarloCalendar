import dayjs from "dayjs";
import React, { useContext, useEffect, useState } from "react";
import GlobalContext from "../context/GlobalContext";

export default function Day({ day, rowIdx, currentMonthIdx, year }) {
  const [dayEvents, setDayEvents] = useState([]);
  const {
    setDaySelected,
    filteredEvents,
    setSelectedEvent,
    setViewMode,
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
      ? "bg-blue-600 text-white rounded-full w-7"
      : "";
  }

  function getDayClass() {
    if (day.month() !== currentMonthIdx) {
      return "text-gray-400"; // Grey out days from past month
    } else {
      return "";
    }
  }

  const displayEvents = dayEvents.slice(0, 2);
  if (dayEvents.length > 3) {
    displayEvents.push({ title: `+${dayEvents.length - 2} more`, label: "gray" });
  } else {
    displayEvents.push(...dayEvents.slice(2, 3));
  }

  return (
    <div
      className={`border border-gray-200 flex flex-col ${getDayClass()}`}
      onClick={() => {
        setDaySelected(day);
        setViewMode("day");
      }}
    >
      <header className="flex flex-col items-center">
        {rowIdx === 0 && (
          <p className="text-sm mt-1">
            {day.format("ddd").toUpperCase()}
          </p>
        )}
        <p
          className={`text-sm p-1 my-1 text-center ${getCurrentDayClass()}`}
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
            className={`bg-${evt.label}-200 p-1 mr-3 ml-3 text-gray-600 text-sm rounded mb-1 truncate`}
          >
            {evt.title}
          </div>
        ))}
      </div>
    </div>
  );
}