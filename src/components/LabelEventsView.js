import React, { useContext, useRef } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";

export default function LabelEventsModal({ label, setShowLabelEventsModal }) {
  const {
    filteredEvents,
    setSelectedEvent,
    setShowEventModal,
    dispatchCalEvent,
  } = useContext(GlobalContext);
  const modalRef = useRef(null);

  const labelEvents = filteredEvents.filter((evt) => evt.label === label.name);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCheckboxChange = (event, evt) => {
    event.stopPropagation(); // Prevent triggering the modal when clicking on the checkbox
    const updatedEvent = { ...evt, checked: true };
    dispatchCalEvent({ type: "update", payload: updatedEvent });
    localStorage.setItem(
      "savedEvents",
      JSON.stringify(
        filteredEvents.map((e) => (e.id === evt.id ? updatedEvent : e))
      )
    );
  };

  const eventsWithTime = labelEvents
    .filter((evt) => evt.time && !evt.checked)
    .sort((a, b) => {
      const aTime = dayjs(a.day).hour(a.time.hours).minute(a.time.minutes);
      const bTime = dayjs(b.day).hour(b.time.hours).minute(b.time.minutes);
      return aTime - bTime;
    });

  const eventsWithoutTime = labelEvents
    .filter((evt) => !evt.time && !evt.checked)
    .sort((a, b) => {
      const aTime = dayjs(a.day);
      const bTime = dayjs(b.day);
      return aTime - bTime;
    });

  const checkedEvents = labelEvents.filter((evt) => evt.checked);

  const orderedEvents = [
    ...eventsWithTime,
    ...eventsWithoutTime,
    ...checkedEvents,
  ];

  return (
    <div className="fixed inset-0 flex justify-center items-center z-40 pointer-events-none bg-black bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-75">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-900 w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative ml-64 mt-16 pointer-events-auto z-50"
      >
        <hr className="border-gray-200 dark:border-gray-700" />
        <div className="p-4 overflow-auto relative">
          <div className="flex items-center justify-between mb-6 w-full">
            <h2 className="text-lg font-bold text-left mb-6 ml-6 mt-5 text-gray-600 dark:text-gray-200">
              Events for{" "}
              <span style={{ color: label.color }}>{label.name}</span>
            </h2>
            <button
              onClick={() => setShowLabelEventsModal(false)}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 rounded-full p-2 w-10 h-10 flex items-center justify-center mr-10"
            >
              <span className="material-icons dark:text-gray-200">close</span>
            </button>
          </div>
          {orderedEvents.length === 0 && (
            <p className="text-gray-500 dark:text-gray-200 text-sm items-center flex justify-center">
              There are no events for this label.
            </p>
          )}
          <div className="grid grid-cols-4 gap-4 ml-6">
            {orderedEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col justify-between items-start mb-2 p-2 rounded cursor-pointer"
                style={{
                  backgroundColor: evt.checked
                    ? "rgba(128, 128, 128, 0.8)"
                    : `${label.color}80`,
                }}
              >
                <div className="flex justify-between w-full">
                  <div className="flex flex-col">
                    <span
                      className="font-bold"
                      style={{ color: evt.checked ? "black" : label.color }}
                    >
                      {evt.title}
                    </span>
                    <p
                      className="text-sm w-44"
                      style={{
                        color: evt.checked ? "black" : label.color,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        height: "2.7rem",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {evt.description}
                    </p>
                    <p
                      className="text-sm mt-6"
                      style={{ color: evt.checked ? "black" : label.color }}
                    >
                      {dayjs(evt.day).format("MMMM D, YYYY")}{" "}
                      {evt.time && `, at ${evt.time.hours}:${evt.time.minutes}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-6 mr-6">
                    {evt.time && (
                      <>
                        <input
                          type="checkbox"
                          className="rounded-full w-6 h-6 cursor-pointer"
                          checked={evt.checked}
                          onChange={(e) => handleCheckboxChange(e, evt)}
                        />
                      </>
                    )}
                    <span
                      className="material-icons cursor-pointer"
                      style={{ color: evt.checked ? "black" : label.color }}
                      onClick={() => handleEventClick(evt)}
                    >
                      edit
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}