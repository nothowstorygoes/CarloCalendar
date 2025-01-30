import React, { useContext, useState, useRef, useEffect } from "react";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { auth, db } from "../firebase";
import { addDoc, collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import ConfirmDelete from "./ConfirmDelete";

export const getNextCalendarId = async () => {
  try {
    const calendarsRef = collection(db, `users/${auth.currentUser.uid}/calendars`);
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
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (editCalendarId !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editCalendarId]);

  const handleCreateCalendar = async () => {
    const newCalendar = {
      name: newCalendarName,
      id: (await getNextCalendarId()).toString(),
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
    if (editCalendarId === calendar.id) {
      // Discard changes
      setEditCalendarId(null);
      setEditCalendarName("");
    } else {
      // Start editing
      setEditCalendarId(calendar.id);
      setEditCalendarName(calendar.name);
    }
  };

  const handleCalendarClick = (calendar) => {
    setSelectedCalendar(calendar);
    setViewMode("labelManager");
  };

  const handleEditCalendarNameChange = (e) => {
    setEditCalendarName(e.target.value);
  };

  const handleUpdateCalendarName = async () => {
    try {
      const calendarsRef = collection(db, `users/${auth.currentUser.uid}/calendars`);
      const calendarQuery = query(calendarsRef, where("id", "==", editCalendarId));
      const calendarSnapshot = await getDocs(calendarQuery);
  
      if (calendarSnapshot.empty) {
        console.log("No matching calendar document found!");
        return;
      }
  
      const calendarDoc = calendarSnapshot.docs[0];
      console.log("Calendar document fetched:", calendarDoc.data());
      await updateDoc(calendarDoc.ref, { name: editCalendarName });
      setCalendars(
        calendars.map((cal) =>
          cal.id === editCalendarId ? { ...cal, name: editCalendarName } : cal
        )
      );
      setEditCalendarId(null);
      setEditCalendarName("");
    } catch (error) {
      console.error("Error updating calendar name:", error);
    }
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
          <div className="mb-8 flex justify-center">
            <input
              type="text"
              placeholder={t("add_calendar")}
              required
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
              className="border p-2 rounded mr-4 w-64 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-50"
            />
            <button
              onClick={handleCreateCalendar}
              className="bg-blue-500 text-white p-2 rounded ml-2 w-24"
            >
              {t("create")}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {sortedCalendars.map(({ id, name }, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between mb-2 p-4 rounded"
                style={{ backgroundColor: "#4285F4" }}
              >
                {editCalendarId === id ? (
                  <div className="flex items-center">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editCalendarName}
                      onChange={handleEditCalendarNameChange}
                      className="border-none p-0 m-0 w-auto bg-transparent rounded-l text-black font-bold focus:outline-none"
                      style={{ height: "auto" , border: "none" }}
                    />
                    <button
                      onClick={handleUpdateCalendarName}
                      className="ml-2 bg-blue-700 text-white py-1 px-2.5 rounded-4xl"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <span
                    className="font-bold cursor-pointer"
                    style={{ color: "#000" }}
                    onClick={() => handleCalendarClick({ id, name })}
                  >
                    {name}
                  </span>
                )}
                <div>
                  <span
                    className="material-icons text-black ml-2 cursor-pointer mr-5"
                    onClick={() => handleEditCalendar({ id, name })}
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