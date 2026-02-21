import React, { useContext, useRef, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/it";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import {
  doc,
  deleteDoc,
  getDoc,
  query,
  collection,
  updateDoc,
  where,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import DaySelector from "./daySelector";

const truncateText = (text, maxLength) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
};

// --- EVENT ITEM AGGIORNATO CON isShared e isReadOnly ---
const EventItem = ({
  evt,
  handleEventClick,
  handleCheckboxChange,
  handleDeleteEvent,
  getLabelColor,
  isShared,
  isReadOnly
}) => (
  <div className="flex justify-center items-center flex-col md:flex-row">
    <div
      key={evt.id}
      className={`flex md:justify-between w-5/6 md:w-[70rem] md:items-center mb-2 p-2 rounded transition-all duration-300 flex-col md:flex-row ${
        isReadOnly ? "cursor-default" : "cursor-pointer"
      }`}
      style={{
        backgroundColor:
          evt.time && evt.checked
            ? `${getLabelColor(evt.label)}80`
            : !evt.time && evt.checked
            ? "rgba(128, 128, 128, 0.8)"
            : getLabelColor(evt.label),
      }}
    >
      <div 
        className="flex items-center" 
        onClick={() => {
          if (!isReadOnly) handleEventClick(evt);
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <div className="relative group">
                <span className="text-black-600 font-bold md:w-68 relative flex items-center">
                  <span>
                    {truncateText(evt.title, 30)} &nbsp; &nbsp;
                    {evt.postponable && "↷"}
                  </span>
                  
                  {/* ICONA DUE OMINI PER EVENTO CONDIVISO */}
                  {isShared && (
                    <span 
                      className="material-icons ml-2 text-sm text-gray-800" 
                      title={isReadOnly ? "Condiviso (Sola lettura)" : "Condiviso"}
                    >
                      group
                    </span>
                  )}

                  <div className="!hidden md:!block absolute left-0 top-full mt-1 w-max p-2 bg-zinc-900 text-white font-bold border border-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {evt.title} {isReadOnly && "(Sola Lettura)"}
                  </div>
                </span>
              </div>
              {evt.repeat && (
                <div className="relative group ml-2">
                  <span className="text-black-600 font-bold">🗘</span>
                  <div className="!hidden md:!block absolute left-0 top-full mt-1 w-max p-2 bg-zinc-900 text-white font-bold border border-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {evt.repeatType}
                  </div>
                </div>
              )}
            </div>
            <p
              className="text-sm md:w-96 dark:text-black"
              style={{
                color: "black",
                textOverflow: "ellipsis",
              }}
            >
              {evt.description}
            </p>
          </div>
        </div>
        <div className="w-16">
          {evt.time && <p className="text-sm text-black"> alle {evt.time}</p>}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between md:justify-end">
        <p className="text-sm md:mr-3 text-black font-bold">{evt.label}</p>
        <p className="text-sm md:mr-3 text-black">
        creato il {dayjs(Number(evt.id.substring(0, 13))).format("DD/MM/YYYY")}
        </p>
        <div className="items-center flex flex-row">
          {!evt.time && (
            <input
              type="checkbox"
              className={`rounded-full w-6 h-6 mr-4 md:mr-6 md:ml-6 ${
                isReadOnly ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
              checked={evt.checked}
              disabled={isReadOnly} // Disabilita la spunta se è solo lettura!
              onChange={(e) => {
                if (!isReadOnly) handleCheckboxChange(e, evt);
              }}
            />
          )}
          {evt.time ? (<div className="w-[4.5rem]"></div>) :""}
          
          {/* MOSTRA IL TASTO DELETE SOLO SE NON È IN SOLA LETTURA */}
          {!isReadOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEvent(evt.id);
              }}
              className="material-icons cursor-pointer text-black"
            >
              delete
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default function DayInfoModal() {
  const {
    daySelected,
    setDaySelected,
    filteredEvents,
    dispatchCalEvent,
    setSelectedEvent,
    setShowEventModal,
    labels,
    calendars, // <--- AGGIUNTO CALENDARS DAL CONTESTO
  } = useContext(GlobalContext);
  const modalRef = useRef(null);
  const { t } = useTranslation();
  const today = dayjs();
  const [loading, setLoading] = useState(false);
  const [showDaySelector, setShowDaySelector] = useState(false); 
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState(null);

  const dayEvents = useMemo(() => {
    const events = filteredEvents.filter(
      (evt) =>
        dayjs(evt.day).format("DD-MM-YY") === daySelected.format("DD-MM-YY")
    );

    events.sort((a, b) => {
      const labelA = labels.find((lbl) => lbl.name === a.label);
      const labelB = labels.find((lbl) => lbl.name === b.label);
      return (labelA?.code || 0) - (labelB?.code || 0);
    });

    events.sort((a, b) => {
      if (a.time && b.time) {
        const [hoursA, minutesA] = a.time.split(":").map(Number);
        const [hoursB, minutesB] = b.time.split(":").map(Number);
        const timeA = dayjs().hour(hoursA).minute(minutesA);
        const timeB = dayjs().hour(hoursB).minute(minutesB);
        return timeA - timeB;
      }
      return 0;
    });

    events.sort((a, b) => a.checked - b.checked);

    return events;
  }, [filteredEvents, daySelected, labels]);

  const handleDeleteEvent = async (eventId) => {
    try {
      const eventRef = doc(db, `users/${auth.currentUser.uid}/events`, eventId);
      const eventDoc = await getDoc(eventRef);
      const event = eventDoc.data();

      if (event.repeat) {
        setDeleteTargetEvent(event);
        setShowDeleteConfirmation(true);
      } else {
        await deleteDoc(eventRef);
        dispatchCalEvent({ type: "delete", payload: { id: eventId } });
      }
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  const handleDeleteSingle = async () => {
    if (deleteTargetEvent) {
      await deleteDoc(
        doc(db, `users/${auth.currentUser.uid}/events`, deleteTargetEvent.id)
      );
      dispatchCalEvent({
        type: "delete",
        payload: { id: deleteTargetEvent.id },
      });
      setShowDeleteConfirmation(false);
      setDeleteTargetEvent(null);
    }
  };

  const handleDeleteFuture = async () => {
    setLoading(true);
    if (deleteTargetEvent) {
      try {
        const eventsQuery = query(
          collection(db, `users/${auth.currentUser.uid}/events`),
          where("repeat", "==", deleteTargetEvent.repeat),
          where("checked", "==", false)
        );
        const querySnapshot = await getDocs(eventsQuery);
        const batch = writeBatch(db); 
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
          dispatchCalEvent({ type: "delete", payload: { id: doc.id } });
        });
        await batch.commit(); 
      } catch (error) {
        console.error("Error deleting future events: ", error);
      }
      setLoading(false);
      setShowDeleteConfirmation(false);
      setDeleteTargetEvent(null);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handlePrevDay = () => {
    setDaySelected(daySelected.subtract(1, "day"));
  };

  const handleNextDay = () => {
    setDaySelected(daySelected.add(1, "day"));
  };

  const handleCheckboxChange = async (event, evt) => {
    event.stopPropagation();
    const updatedEvent = { ...evt, checked: !evt.checked };
    try {
      const eventRef = doc(db, `users/${auth.currentUser.uid}/events`, evt.id);
      await updateDoc(eventRef, { checked: updatedEvent.checked });
    } catch (error) {
      console.error("Error updating event: ", error);
    }
    dispatchCalEvent({ type: "update", payload: updatedEvent });
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
    <div className="h-[48.7rem] -mt-5 md:mt-0 md:h-[calc(100%-4rem)] w-screen md:w-[calc(100%-1.5rem)] left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-900 md:dark:bg-zinc-950 rounded-3xl overflow-x-hidden">
      {showDeleteConfirmation && (
        <DeleteConfirmationModal
          onClose={() => setShowDeleteConfirmation(false)}
          onDeleteSingle={handleDeleteSingle}
          onDeleteFuture={handleDeleteFuture}
          laoding={loading}
        />
      )}
      {showDaySelector && (
        <DaySelector
          setDaySelected={setDaySelected}
          onClose={() => setShowDaySelector(false)}
        />
      )}
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-900 md:dark:bg-zinc-950 w-screen md:w-[calc(100%-16rem)] md:h-[calc(100%-2rem)] md:max-w-none md:max-h-none overflow-hidden relative md:mt-8"
      >
        <div className="md:p-4 relative w-full">
          <div className="flex items-center justify-center md:justify-between mb-8 md:mb-16 w-screen md:w-2/3 md:mx-auto md:space-x-1">
            <button
              onClick={handlePrevDay}
              className="bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center transition-all duration-300 mr-10 md:mr-0 ml-10 md:ml-0"
            >
              <span className="material-icons dark:text-zinc-50">
                chevron_left
              </span>
            </button>
            <h2
              onClick={() => setShowDaySelector(true)}
              className={`text-lg font-bold text-center text-gray-600 dark:text-zinc-50 p-2 md:p-6 cursor-pointer md:pointer-events-none ${
                isToday ? "bg-blue-500 text-white p-2 md:p-6 rounded-3xl" : ""
              }`}
            >
              {capitalizeFirstLetter(
                daySelected.locale("it").format("dddd, MMMM D, YYYY")
              )}
            </h2>
            <button
              onClick={handleNextDay}
              className="bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center transition-all duration-300 mr-10 md:mr-0 ml-10 md:ml-0"
            >
              <span className="material-icons dark:text-zinc-50">
                chevron_right
              </span>
            </button>
          </div>
          {dayEvents.length === 0 && (
            <p className="text-gray-500 dark:text-zinc-50 text-sm items-center flex justify-center">
              {t("no_events")}
            </p>
          )}
          <div className="w-screen md:w-auto ml:overflow-scroll overflow-auto h-[35rem] md:h-[60vh] overflow-x-hidden custom-scrollbar">
            
            {/* LOGICA DELLA MAGIA: CALCOLO PERMESSI */}
            {dayEvents.map((evt) => {
              // Cerchiamo il calendario a cui appartiene l'evento (tramite calendarId)
              const calendar = calendars.find(
                (c) => c.id === evt.calendarId || c.docId === evt.calendarId
              );
              
              // Capiamo se è condiviso e se l'utente ha solo permessi di lettura
              const isShared = calendar?.isShared || evt.isShared;
              const isReadOnly = isShared && calendar?.role === "read";

              return (
                <EventItem
                  key={evt.id}
                  evt={evt}
                  handleEventClick={handleEventClick}
                  handleCheckboxChange={handleCheckboxChange}
                  handleDeleteEvent={handleDeleteEvent}
                  getLabelColor={getLabelColor}
                  isShared={isShared}
                  isReadOnly={isReadOnly}
                />
              );
            })}

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
        </div>
      </div>
    </div>
  );
}