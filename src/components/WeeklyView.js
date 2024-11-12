import React, { useContext, useRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";

export default function WeeklyView() {
  const {
    daySelected,
    setDaySelected,
    filteredEvents,
    dispatchCalEvent,
    setSelectedEvent,
    setShowEventModal,
    setViewMode,
  } = useContext(GlobalContext);
  const modalRef = useRef(null);
  const [currentWeek, setCurrentWeek] = useState([]);

  useEffect(() => {
    const startOfWeek = daySelected.startOf("week").add(1, "day"); // Start from Monday
    const week = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
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

  return (
    <div className="h-full w-full fixed left-0 top-0 flex justify-center items-center">
      <div
        ref={modalRef}
        className="bg-white w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative ml-64 mt-16"
      >
        <div className="p-4 overflow-auto relative">
          <div className="flex items-center justify-between mb-6 w-2/3 mx-auto space-x-1">
            <button
              onClick={handlePrevWeek}
              className="bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <h2 className="text-lg font-bold text-center mb-6">
              {daySelected.startOf("week").add(1, "day").format("MMMM D")} -{" "}
              {daySelected.endOf("week").add(1, "day").format("MMMM D, YYYY")}
            </h2>
            <button
              onClick={handleNextWeek}
              className="bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {currentWeek.slice(0, 3).map((day, idx) => (
                <div key={idx} className="p-4 rounded-lg h-48">
                  <h3
                    className="text-lg font-bold mb-2 cursor-pointer"
                    onClick={() => handleDateClick(day)}
                  >
                    {day.format("dddd, MMMM D")}
                  </h3>
                  {filteredEvents.filter(
                    (evt) =>
                      dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                  ).length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      There are no upcoming events for today.
                    </p>
                  ) : (
                    filteredEvents
                      .filter(
                        (evt) =>
                          dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                      )
                      .slice(0, 2)
                      .map((evt) => (
                        <div
                          key={evt.id}
                          className={`flex justify-between items-center mb-2 bg-${evt.label}-200 p-2 rounded cursor-pointer`}
                          onClick={() => handleEventClick(evt)}
                        >
                          <div className="flex items-center">
                            <span
                              className={`bg-${evt.label}-500 w-2 h-2 rounded-full mr-4`}
                            ></span>
                            <div>
                              <span className="text-black-600 font-bold">
                                {evt.title}
                              </span>
                              <p className="text-gray-500 text-sm">
                                {evt.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-row items-center">
                            <p className={`text-gray-700 text-sm mr-3`}>
                              {evt.label}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the modal when clicking on the delete button
                                handleDeleteEvent(evt.id);
                              }}
                              className="material-icons-outlined text-red-600 cursor-pointer"
                            >
                              delete
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                  {filteredEvents.filter(
                    (evt) =>
                      dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                  ).length > 2 && (
                    <p className="text-gray-500 text-sm">
                      +
                      {filteredEvents.filter(
                        (evt) =>
                          dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                      ).length - 2}{" "}
                      more
                    </p>
                  )}
                  <hr className="mt-4" />
                </div>
              ))}
            </div>
            <div>
              {currentWeek.slice(3).map((day, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${idx < 2 ? 'h-48' : 'h-24'}`}>
                  <h3
                    className="text-lg font-bold mb-2 cursor-pointer"
                    onClick={() => handleDateClick(day)}
                  >
                    {day.format("dddd, MMMM D")}
                  </h3>
                  {filteredEvents.filter(
                    (evt) =>
                      dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                  ).length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      There are no upcoming events for today.
                    </p>
                  ) : (
                    filteredEvents
                      .filter(
                        (evt) =>
                          dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                      )
                      .slice(0, 2)
                      .map((evt) => (
                        <div
                          key={evt.id}
                          className={`flex justify-between items-center mb-2 bg-${evt.label}-200 p-2 rounded cursor-pointer`}
                          onClick={() => handleEventClick(evt)}
                        >
                          <div className="flex items-center">
                            <span
                              className={`bg-${evt.label}-500 w-2 h-2 rounded-full mr-4`}
                            ></span>
                            <div>
                              <span className="text-black-600 font-bold">
                                {evt.title}
                              </span>
                              <p className="text-gray-500 text-sm">
                                {evt.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-row items-center">
                            <p className={`text-gray-700 text-sm mr-3`}>
                              {evt.label}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the modal when clicking on the delete button
                                handleDeleteEvent(evt.id);
                              }}
                              className="material-icons-outlined text-red-600 cursor-pointer"
                            >
                              delete
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                  {filteredEvents.filter(
                    (evt) =>
                      dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                  ).length > 2 && (
                    <p className="text-gray-500 text-sm">
                      +
                      {filteredEvents.filter(
                        (evt) =>
                          dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
                      ).length - 2}{" "}
                      more
                    </p>
                  )}
                  <hr className="mt-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}