import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalContext from "../context/GlobalContext";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";

export default function CalendarEditor({ selectedCalendar, setShowCalendarEditor }) {
  const { t } = useTranslation();
  const { calendars, setCalendars } = useContext(GlobalContext);
  const [name, setName] = useState("");
  const [prioritized, setPrioritized] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (selectedCalendar) {
      setName(selectedCalendar.name);
      setPrioritized(selectedCalendar.prioritized);
    }
  }, [selectedCalendar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedCalendar = {
      name,
      prioritized,
    };
    console.log(selectedCalendar);
    try {
      const calendarsRef = collection(db, `users/${auth.currentUser.uid}/calendars`);
      const q = query(calendarsRef, where("id", "==", selectedCalendar.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const calendarDoc = querySnapshot.docs[0].ref;
        await updateDoc(calendarDoc, updatedCalendar);

        setCalendars(
          calendars.map((cal) =>
            cal.id === selectedCalendar.id ? { ...cal, ...updatedCalendar } : cal
          )
        );
        setShowCalendarEditor(false);
      } else {
        console.error("Calendar not found");
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error updating calendar: ", error);
      setShowAlert(true);
    }
  };

  const handleClose = () => {
    setShowCalendarEditor(false);
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-40 dark:bg-zinc-800 dark:bg-opacity-75">
      <form
        className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl w-1/3 z-50"
        onSubmit={handleSubmit}
      >
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center rounded-t-lg">
          <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
            drag_handle
          </span>
          <button
            onClick={handleClose}
            className="material-icons-outlined text-gray-400 dark:text-zinc-200"
          >
            close
          </button>
        </header>
        <div className="p-3">
          <div className="flex flex-col gap-y-6">
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                calendar_today
              </span>
              <input
                type="text"
                name="name"
                placeholder="Calendario"
                value={name}
                required
                className="ml-4 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold w-40 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 bg-gray-100 dark:bg-zinc-700 rounded"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                star
              </span>
              <label className="ml-4 text-gray-600 dark:text-zinc-200">
                Predefinito
              </label>
              <input
                type="checkbox"
                name="prioritized"
                checked={prioritized}
                className="ml-2 form-checkbox h-5 w-5 text-blue-600 rounded-full"
                onChange={(e) => setPrioritized(e.target.checked)}
              />
            </div>
          </div>
        </div>
        <footer className="flex justify-end border-t p-3 mt-5">
          {showAlert && (
            <div className="text-sm text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error updating calendar!</strong>
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded text-white"
          >
            {t("save")}
          </button>
        </footer>
      </form>
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