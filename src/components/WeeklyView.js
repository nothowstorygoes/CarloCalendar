import React, { useContext, useRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";
import { db, auth } from "../firebase";
import { getDocs, collection } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import "dayjs/locale/it"; // Import Italian locale
import { getWeeks } from "../util";

export default function WeeklyView() {
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
  const [label, setLabel] = useState([]);


  useEffect(() => {
    const fetchLabels = async () => {
      const labelsSnapshot = await getDocs(
        collection(db, `users/${auth.currentUser.uid}/labels`)
      );
      const labelsData = labelsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLabel(labelsData);
    };

    fetchLabels();
  }, []);

  const getLabelCode = (labelName) => {
    const label = labels.find((lbl) => lbl.name === labelName);
    return label ? label.code : 0; // Default to 0 if label not found
  };

  useEffect(() => {
    const weeks = getWeeks(daySelected.month(), daySelected.year());
    const startOfWeek = daySelected.startOf("week").add(1, "day"); // Start from Monday
    const week = weeks.find((week) =>
      week.some((day) => day.isSame(daySelected, "day"))
    );
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

  function truncateTitle(title) {
    return title.length > 4 ? title.slice(0, 5) + "..." : title;
  }

  const isToday = daySelected.isSame(dayjs(), "day");

  const MAX_EVENTS = 5; // Set the maximum number of events to display

  return (
    <div className="h-[calc(100%-4rem)] w-[calc(100%-1.5rem)] rounded-3xl left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-950 w-[calc(100%-2rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative mt-8"
      >
        <div className="p-4 overflow-auto relative overflow-x-hidden">
          <div className="flex items-center justify-between mb-6 w-2/3 mx-auto space-x-1">
            <button
              onClick={handlePrevWeek}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons dark:text-zinc-50">
                chevron_left
              </span>
            </button>
            <h2 className="text-lg font-bold text-center mb-6 text-gray-600 dark:text-zinc-50">
              {capitalizeFirstLetter(
                daySelected.locale("it").startOf("week").format("MMMM D")
              )}{" "}
              -{" "}
              {capitalizeFirstLetter(
                daySelected.locale("it").endOf("week").format("MMMM D, YYYY")
              )}
            </h2>
            <button
              onClick={handleNextWeek}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons dark:text-zinc-50">
                chevron_right
              </span>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-8 h-full">
            {currentWeek.map((day, idx) => {
              const events = filteredEvents.filter(
                (evt) =>
                  dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
              );
              const sortedEvents = events.sort(
                (a, b) => getLabelCode(a.label) - getLabelCode(b.label)
              );
              const displayEvents = sortedEvents.slice(0, MAX_EVENTS);
              const remainingEvents = events.length - MAX_EVENTS;

              return (
                <div
                  key={idx}
                  className="p-4 h-full flex flex-col items-center"
                >
                  <h3
                    className={`text-lg font-bold mb-2 cursor-pointer text-gray-600 dark:text-zinc-50 ${
                      day.isSame(dayjs(), "day")
                        ? "bg-blue-500 text-white p-6 rounded-3xl"
                        : ""
                    }`}
                    onClick={() => handleDateClick(day)}
                  >
                    {capitalizeFirstLetter(
                      day.locale("it").format("dddd, MMMM D")
                    )}
                  </h3>
                  {displayEvents.map((evt) => (
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
                          <div className="relative group">
                            <span className="text-black font-bold">
                              {truncateTitle(evt.title)}
                            </span>
                            <div className="absolute left-0 top-full mt-1 w-max p-2 bg-zinc-900 text-white font-bold border border-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {evt.title}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {remainingEvents > 0 && (
                    <p className="text-sm text-gray-500 dark:text-zinc-50">
                      + {remainingEvents}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
