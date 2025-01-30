import React, { useContext, useState, useRef, useEffect } from "react";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { auth, db } from "../firebase";
import { addDoc, collection, getDocs } from "firebase/firestore";

export const getNextCalendarId = async () => {
    try {
        const calendarsRef = collection(db, `users/${auth.currentUser.uid}/calendars`);
        const querySnapshot = await getDocs(calendarsRef);
        const calendarIds = querySnapshot.docs.map(doc => doc.data().id);
        return Math.max(...calendarIds, 0) + 1;
    } catch (error) {
        console.error("Error getting next calendar ID: ", error);
        return 1; // Default to 1 in case of error
    }
};

export default function CalendarSettings() {
    const { calendars, setCalendars, setViewMode, selectedCalendar, setSelectedCalendar } = useContext(GlobalContext);
    const [newCalendarName, setNewCalendarName] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const { t } = useTranslation();
    const modalRef = useRef(null);

    const handleCreateCalendar = async () => {
        const newCalendar = {
            name: newCalendarName,
            id: await getNextCalendarId(),
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

    const deleteCalendar = (calendar) => {
        setSelectedCalendar(calendar);
    };

    const handleClickOutside = (event) => {
        if (event.target.id === "calendar-manager-overlay") {
            setViewMode("month");
        }
    };

    const handleEditCalendar = (calendar) => {
        setSelectedCalendar(calendar);
        // Implement edit functionality here
    };

    const handleCalendarClick = (calendar) => {
        setSelectedCalendar(calendar);
        setViewMode("labelManager");
    };

    const sortedCalendars = [...calendars].sort((a, b) => a.id - b.id);

    return (
        <div
            id="calendar-manager-overlay"
            className="fixed top-0 left-0 w-full h-full flex justify-center items-center z-50 dark:bg-zinc-950 dark:bg-opacity-0"
            onClick={handleClickOutside}
            style={{
                "--scrollbar-track-bg": document.documentElement.classList.contains(
                    "dark"
                )
                    ? "#3f3f46"
                    : "#e5e7eb",
            }}
        >
            <div
                ref={modalRef}
                className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-5.5rem)] max-w-none max-h-none overflow-hidden relative ml-64 mt-16 rounded-3xl mr-5 mb-8"
            >
                <div className="w-full flex justify-between items-center mt-8">
                <button
                    onClick={() => setViewMode("day")}
                    className="material-icons-outlined text-gray-400 dark:text-zinc-50 ml-14 flex flex-end"
                >
                    close
                </button>
            </div>
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
                    {showAlert && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">Error: &nbsp;</strong>
                            <span className="block sm:inline">A calendar with this name already exists!</span>
                            <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                                <button onClick={() => setShowAlert(false)}>
                                    <span className="material-icons-outlined">close</span>
                                </button>
                            </span>
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-6">
                        {sortedCalendars.map(({ id, name }, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between mb-2 p-4 rounded"
                                style={{backgroundColor: "#4285F4"}}
                            >
                                <span className="font-bold cursor-pointer" style={{ color: "#000" }} onClick={() => handleCalendarClick({ id, name })}>
                                    {name}
                                </span>
                                <div>
                                    <span
                                        className="material-icons text-black ml-2 cursor-pointer mr-5"
                                        onClick={() => handleEditCalendar({ id, name })}
                                    >
                                        edit
                                    </span>
                                    <button
                                        onClick={() => deleteCalendar({ id, name })}
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