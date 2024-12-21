import React, { useContext, useRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import "dayjs/locale/it"; // Import Italian locale

export default function WorkWeekView() {
  const {
    daySelected,
    setDaySelected,
    filteredEvents,
    dispatchCalEvent,
    setSelectedEvent,
    setShowEventModal,
    setViewMode,
    labels,
  } = useContext(GlobalContext);
  const modalRef = useRef(null);
  const [currentWeek, setCurrentWeek] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const startOfWeek = daySelected.startOf("week").add(1, "day"); // Start from Monday
    const week = Array.from({ length: 5 }, (_, i) => startOfWeek.add(i, "day")); // Only Monday to Friday
    setCurrentWeek(week);
  }, [daySelected]);

  const handleDeleteEvent = (eventId) => {
    dispatchCalEvent({ type: "delete", payload: { id: eventId } });
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDateClick = (day) => {
    setDaySelected(day);
    setViewMode("day");
  };

  const handlePrevWeek = () => {
    setDaySelected(daySelected.subtract(1, "week"));
  };

  const handleNextWeek = () => {
    setDaySelected(daySelected.add(1, "week"));
  };

  const getLabelColor = (labelName) => {
    const label = labels.find((lbl) => lbl.name === labelName);
    return label ? label.color : "gray";
  };

  function capitalizeFirstLetter(string) {
    return string.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const isToday = daySelected.isSame(dayjs(), "day");

  return (
    <div className="h-[calc(100%-6rem)] w-[calc(100%-1.5rem)] rounded-3xl left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-950 w-[calc(100%-8rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative mt-8"
      >
        <div className="p-4 overflow-auto relative">
          <div className="flex items-center justify-between mb-6 w-2/3 mx-auto space-x-1">
            <button
              onClick={handlePrevWeek}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons dark:text-zinc-50">chevron_left</span>
            </button>
            <h2 className="text-lg font-bold text-center mb-6 text-gray-600 dark:text-zinc-50">
              {capitalizeFirstLetter(
                daySelected.locale("it").startOf("week").add(1, "day").format("MMMM D")
              )}{" "}
              -{" "}
              {capitalizeFirstLetter(
                daySelected.locale("it").startOf("week").add(5, "day").format("MMMM D, YYYY")
              )}
            </h2>
            <button
              onClick={handleNextWeek}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons dark:text-zinc-50">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-5 gap-8 h-full">
            {currentWeek.map((day, idx) => (
              <div key={idx} className="p-4 h-full flex flex-col items-center">
                <h3
                  className={`text-lg font-bold mb-2 cursor-pointer text-gray-600 dark:text-zinc-50 ${
                    day.isSame(dayjs(), "day")
                      ? "bg-blue-500 text-white p-6 rounded-3xl"
                      : ""
                  }`}
                  onClick={() => handleDateClick(day)}
                >
                  {capitalizeFirstLetter(day.locale("it").format("dddd, MMMM D"))}
                </h3>
                {filteredEvents.filter(
                  (evt) =>
                    dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                ).length === 0 ? (
                  <p className="text-gray-500 dark:text-zinc-50 text-sm">
                    {t("no_events")}
                  </p>
                ) : (
                  filteredEvents
                    .filter(
                      (evt) =>
                        dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                    )
                    .map((evt) => (
                      <div
                        key={evt.id}
                        className="flex justify-between items-center mb-2 p-2 rounded cursor-pointer w-full"
                        style={{
                          backgroundColor: evt.checked
                            ? "rgba(128, 128, 128, 0.8)"
                            : `${getLabelColor(evt.label)}`,
                        }}
                        onClick={() => handleEventClick(evt)}
                      >
                        <div className="flex items-center w-full">
                          <div className="w-full">
                            <span className="font-bold truncate text-black">
                              {evt.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}