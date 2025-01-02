import React, { useContext, useRef, useState } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function LabelEventsModal({ label, setShowLabelEventsModal }) {
  const {
    filteredEvents,
    setSelectedEvent,
    setShowEventModal,
    dispatchCalEvent,
  } = useContext(GlobalContext);
  const modalRef = useRef(null);
  const { t } = useTranslation();
  const [showPassedEvents, setShowPassedEvents] = useState(false);
  const labelEvents = filteredEvents.filter((evt) => evt.label === label.name);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCheckboxChange = async (event, evt) => {
    event.stopPropagation(); // Prevent triggering the modal when clicking on the checkbox
    const updatedEvent = { ...evt, checked: !evt.checked };
    dispatchCalEvent({ type: "update", payload: updatedEvent });

    try {
      console.log("Updating event:", updatedEvent);
      const eventRef = doc(
        db,
        `users/${auth.currentUser.uid}/events`,
        String(evt.id)
      ); // Ensure evt.id is a string
      await updateDoc(eventRef, updatedEvent);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const activeEvents = labelEvents.filter((evt) => !evt.checked);
  const passedEvents = labelEvents.filter((evt) => evt.checked);

  const orderedActiveEvents = activeEvents.sort((a, b) => {
    const aTime = dayjs(a.day)
      .hour(a.time?.hours || 0)
      .minute(a.time?.minutes || 0);
    const bTime = dayjs(b.day)
      .hour(b.time?.hours || 0)
      .minute(b.time?.minutes || 0);
    return aTime - bTime;
  });

  const orderedPassedEvents = passedEvents.sort((a, b) => {
    const aTime = dayjs(a.day)
      .hour(a.time?.hours || 0)
      .minute(a.time?.minutes || 0);
    const bTime = dayjs(b.day)
      .hour(b.time?.hours || 0)
      .minute(b.time?.minutes || 0);
    return aTime - bTime;
  });

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const truncate = (str, n) => {
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  return (
    <div className="h-[calc(100%-4rem)] w-[calc(100%-1.5rem)] rounded-3xl left-0 top-0 flex justify-start items-center bg-white dark:bg-zinc-950">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-950 w-full h-[calc(100%-2rem)] overflow-hidden relative pointer-events-auto"
      >
        <div className="p-4 relative h-full">
          <div className="flex items-center justify-between mb-6 w-full">
            <h2 className="text-lg font-bold text-left mb-6 ml-6 text-gray-600 dark:text-zinc-50">
              {t("events_for")}{" "}
              <span style={{ color: label.color }}>{label.name}</span>
            </h2>
            <button
              className={`text-black dark:text-black font-bold rounded px-4 py-2 mr-12 mb-6`}
              style={{
                backgroundColor: showPassedEvents ? label.color : "gray",
              }}
              onClick={() => setShowPassedEvents(!showPassedEvents)}
            >
              {showPassedEvents ? t("active_events") : t("passed_events")}
            </button>
          </div>
          {showPassedEvents ? (
            <div className="grid grid-cols-5 gap-4 pr-4 w-full overflow-auto custom-scrollbar overflow-x-hidden" style={{ maxHeight: '30rem' }}>
              {orderedPassedEvents.length === 0 && (
                <p className="text-gray-500 dark:text-zinc-50 text-sm items-center flex justify-center">
                  {t("no_passed_events")}
                </p>
              )}
              {orderedPassedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex flex-col justify-between items-start mb-2 p-2 rounded cursor-pointer"
                  style={{
                    backgroundColor: "rgba(128, 128, 128, 0.8)",
                  }}
                >
                  <div className="flex justify-between w-full">
                    <div className="flex flex-col">
                      <div className="relative group">
                        <span className="text-black font-bold">
                          {truncate(evt.title, 18)}
                        </span>
                        <div className="absolute left-0 top-full mt-1 w-max max-w-xs p-2 bg-zinc-900 text-white font-bold border border-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {evt.title}
                        </div>
                      </div>{" "}
                      <p
                        className="text-sm w-44"
                        style={{
                          color: "black",
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
                      <p className="text-xs mt-6 text-black font-bold">
                        {capitalizeFirstLetter(
                          dayjs(evt.day).format("MMMM D, YYYY")
                        )}
                        {evt.time && `, alle ${evt.time}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-6 mr-6">
                      <span
                        className="material-icons cursor-pointer text-black"
                        onClick={() => handleEventClick(evt)}
                      >
                        edit
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4 pr-4 w-full overflow-auto custom-scrollbar overflow-x-hidden" style={{ maxHeight: '30rem' }}>
              {orderedActiveEvents.length === 0 && (
                <p className="text-gray-500 dark:text-zinc-50 text-sm items-center flex justify-center">
                  {t("no_active_events")}
                </p>
              )}
              {orderedActiveEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex flex-col justify-between items-start mb-2 p-2 rounded cursor-pointer"
                  style={{
                    backgroundColor: `${label.color}`,
                  }}
                >
                  <div className="flex justify-between w-full">
                    <div className="flex flex-col">
                      <div className="relative group">
                        <span className="text-black font-bold">
                          {truncate(evt.title, 18)}
                        </span>
                        <div className="absolute left-0 top-full mt-1 w-max max-w-xs p-2 bg-zinc-900 text-white font-bold border border-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {evt.title}
                        </div>
                      </div>
                      <p
                        className="text-sm w-44"
                        style={{
                          color: label.color,
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
                      <p className="text-xs mt-6 text-black font-bold">
                        {capitalizeFirstLetter(
                          dayjs(evt.day).format("MMMM D, YYYY")
                        )}
                        {evt.time && `, alle ${evt.time}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-6 mr-6">
                      {!evt.time && (
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
                        className="material-icons cursor-pointer text-black"
                        onClick={() => handleEventClick(evt)}
                      >
                        edit
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--scrollbar-track-bg);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
