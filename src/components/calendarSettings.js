import React, { useContext, useState, useRef, useEffect } from "react";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { auth, db } from "../firebase";
import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import ConfirmDelete from "./ConfirmDelete";
import CalendarEditor from "./calendarEditor";

export const getNextCalendarId = async () => {
  try {
    const calendarsRef = collection(
      db,
      `users/${auth.currentUser.uid}/calendars`
    );
    const querySnapshot = await getDocs(calendarsRef);
    const calendarIds = querySnapshot.docs.map((doc) => doc.data().id);
    return Math.max(...calendarIds, 0) + 1;
  } catch (error) {
    console.error("Error getting next calendar ID: ", error);
    return 1; // Default to 1 in case of error
  }
};

export default function CalendarSettings() {
  const {
    calendars,
    setCalendars,
    setViewMode,
    selectedCalendar,
    setSelectedCalendar,
  } = useContext(GlobalContext);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [editCalendarId, setEditCalendarId] = useState(null);
  const [editCalendarName, setEditCalendarName] = useState("");
  const [prioritized, setPrioritized] = useState(false);
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const [showCalendarEditor, setShowCalendarEditor] = useState(false);
  const editInputRef = useRef(null);

  const handleCreateCalendar = async () => {
    const newCalendar = {
      name: newCalendarName,
      id: (await getNextCalendarId()).toString(),
      prioritized: prioritized,
    };

    try {
      console.log("Creating calendar:", newCalendar);
      const calendarRef = await addDoc(
        collection(db, `users/${auth.currentUser.uid}/calendars`),
        newCalendar
      );
      console.log("Calendar created with ID:", calendarRef.id);
      setCalendars([...calendars, { id: calendarRef.id, ...newCalendar }]);
      setNewCalendarName("");
    } catch (error) {
      console.error("Error creating calendar:", error);
    }
  };

  const handleDeleteCalendar = (calendar) => {
    setSelectedCalendar(calendar);
    setShowConfirmationModal(true);
  };

  const handleEditCalendar = (calendar) => {
    setSelectedCalendar(calendar);
    setShowCalendarEditor(true);
  };

  const handleCalendarClick = (calendar) => {
    setSelectedCalendar(calendar);
    setViewMode("labelManager");
  };

  const handleUpdateCalendarName = async () => {
    //modal
  };

  const sortedCalendars = [...calendars].sort((a, b) => a.id - b.id);

  return (
    <div className="h-[calc(100%-4rem)] w-[calc(100%-1.5rem)] left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950 rounded-3xl">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-2rem)] max-w-none max-h-none overflow-hidden relative mt-8"
      >
        <div className="w-full flex justify-between items-center mt-8"></div>
        <div className="p-4 overflow-auto relative">
          <h2 className="text-lg font-bold mb-4 flex justify-center tracking-widest text-gray-600 dark:text-zinc-50">
            Gestione Calendari
          </h2>
          <div className="mb-8 flex justify-center items-center">
            <input
              type="text"
              placeholder={t("add_calendar")}
              required
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
              className="border p-2 rounded mr-4 w-64 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-50"
            />
            <div className="flex justify-center items-center mr-2 ml-2">
              <label className="text-gray-600 dark:text-zinc-50 mr-2">
                Priorità :
              </label>
              <input
                type="checkbox"
                checked={prioritized}
                onChange={(e) => setPrioritized(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600 rounded-2xl"
              />
            </div>
            <button
              onClick={handleCreateCalendar}
              className="bg-blue-500 text-white p-2 rounded ml-2 w-24"
            >
              {t("create")}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {sortedCalendars.map(({ id, name, prioritized }, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between mb-2 p-4 rounded"
                style={{ backgroundColor: "#4285F4" }}
              >
                <span
                  className="font-bold cursor-pointer"
                  style={{ color: "#000" }}
                  onClick={() => handleCalendarClick({ id, name })}
                >
                  {name}
                </span>
                <div>
                  {prioritized ? (
                    <span className="material-symbols-outlined text-black ml-2 mr-5">
                      priority
                    </span>
                  ) : (
                    ""
                  )}

                  <span
                    className="material-icons text-black ml-2 cursor-pointer mr-5"
                    onClick={() =>
                      handleEditCalendar({ id, name, prioritized })
                    }
                  >
                    edit
                  </span>
                  <button
                    onClick={() => handleDeleteCalendar({ id, name })}
                    className="material-icons-outlined cursor-pointer"
                    style={{ color: "#000" }} // Set contrast color
                  >
                    delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {showConfirmationModal && (
          <ConfirmDelete
            calendar={selectedCalendar}
            setShowConfirmationModal={setShowConfirmationModal}
            setCalendars={setCalendars}
          />
        )}
        {showCalendarEditor && (
          <CalendarEditor
            selectedCalendar={selectedCalendar}
            setShowCalendarEditor={setShowCalendarEditor}
          />
        )}
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
  );
}
