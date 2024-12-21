import React, { useContext, useRef } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db} from "../firebase";

export default function LabelEventsModal({ label, setShowLabelEventsModal }) {
  const {
    filteredEvents,
    setSelectedEvent,
    setShowEventModal,
    dispatchCalEvent,
  } = useContext(GlobalContext);
  const modalRef = useRef(null);
  const { t } = useTranslation();
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
      const eventRef = doc(db, `users/${auth.currentUser.uid}/events`, String(evt.id)); // Ensure evt.id is a string
      await updateDoc(eventRef, updatedEvent);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
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

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return (
    <div className="h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] rounded-3xl left-0 top-0 flex justify-start items-center bg-white dark:bg-zinc-950">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative pointer-events-auto"
      >
        <div className="p-4 overflow-auto relative">
          <div className="flex items-center justify-between mb-6 w-full">
            <h2 className="text-lg font-bold text-left mb-6 ml-6 text-gray-600 dark:text-zinc-50">
              {t("events_for")}{" "}
              <span style={{ color: label.color }}>{label.name}</span>
            </h2>
          </div>
          {orderedEvents.length === 0 && (
            <p className="text-gray-500 dark:text-zinc-50 text-sm items-center flex justify-center">
              {t("no_events_label")}
            </p>
          )}
          <div className="grid grid-cols-4 gap-4 ml-6 overflow-auto">
            {orderedEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col justify-between items-start mb-2 p-2 rounded cursor-pointer"
                style={{
                  backgroundColor: evt.checked
                    ? "rgba(128, 128, 128, 0.8)"
                    : `${label.color}`,
                }}
              >
                <div className="flex justify-between w-full">
                  <div className="flex flex-col">
                    <span
                      className="font-bold text-black"
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
                      className="text-sm mt-6 text-black"
                    >
                      {capitalizeFirstLetter(dayjs(evt.day).format("MMMM D, YYYY"))}{" "}{" "}
                      {evt.time && `, alle ${evt.time.hours}:${evt.time.minutes}`}
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
        </div>
      </div>
    </div>
  );
}