import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import GlobalContext from "../context/GlobalContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function EventModal() {
  const { t } = useTranslation();
  const { setShowEventModal, daySelected, dispatchCalEvent, selectedEvent, labels } = useContext(GlobalContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLabel, setSelectedLabel] = useState(labels[0]?.name || "");
  const [specificTime, setSpecificTime] = useState(false);
  const [date, setDate] = useState(daySelected.toDate());
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description);
      setSelectedLabel(selectedEvent.label);
      setDate(daySelected.toDate());
      if (selectedEvent.time) {
        setSpecificTime(true);
        setHours(selectedEvent.time.hours);
        setMinutes(selectedEvent.time.minutes);
      }
    }
  }, [selectedEvent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const calendarEvent = {
      title,
      description,
      label: selectedLabel,
      day: date.getTime(),
      id: selectedEvent ? selectedEvent.id : Date.now(),
      checked: false,
      time: specificTime ? { hours, minutes } : null,
      userId: auth.currentUser.uid,
    };
    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/events`), calendarEvent);
      dispatchCalEvent({ type: selectedEvent ? "update" : "push", payload: calendarEvent });
      setShowEventModal(false);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-55 dark:bg-zinc-800 dark:bg-opacity-75">
      <form className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl w-1/3 z-50" onSubmit={handleSubmit}>
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center rounded-t-lg">
          <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
            drag_handle
          </span>
          <div>
            {selectedEvent && (
              <span
                onClick={() => {
                  dispatchCalEvent({ type: "delete", payload: selectedEvent });
                  setShowEventModal(false);
                }}
                className="material-icons-outlined text-gray-400 dark:text-zinc-200 cursor-pointer"
              >
                delete
              </span>
            )}
            <button
              onClick={() => setShowEventModal(false)}
              className="material-icons-outlined text-gray-400 dark:text-zinc-200"
            >
              close
            </button>
          </div>
        </header>
        <div className="p-3">
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                edit
              </span>
              <input
                type="text"
                name="title"
                placeholder={t('add_title')}
                value={title}
                required
                className="ml-6 pt-3 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold pb-2 w-60 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <textarea
              name="description"
              placeholder={t('add_description')}
              value={description}
              required
              rows="4"
              className="ml-12 pt-3 border-0 text-gray-600 dark:text-zinc-200 pb-2 w-96 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 bg-gray-100 dark:bg-zinc-700 rounded"
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center flex-row mt-5">
              <div className="flex items-center">
                <span className="material-icons text-gray-400 dark:text-zinc-200">
                  event
                </span>
              </div>
              <div className="flex items-center gap-x-2 ml-6">
                <DatePicker
                  selected={date}
                  onChange={(date) => setDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-32 p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center flex-row mt-5">
              <div className="flex items-center">
                <span className="material-icons text-gray-400 dark:text-zinc-200">
                  access_time
                </span>
                
                <label className="ml-6 text-gray-600 dark:text-zinc-200">{t('access_time')}</label>
              </div>
              <div className="flex items-center gap-x-2 ml-2">
                <input
                  type="number"
                  name="hours"
                  placeholder="HH"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className={`w-16 p-2 border rounded ${specificTime ? "border-black dark:border-zinc-200" : "border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-700"}`}
                  min="0"
                  max="23"
                  disabled={!specificTime}
                />
                <input
                  type="number"
                  name="minutes"
                  placeholder="MM"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className={`w-16 p-2 border rounded ${specificTime ? "border-black dark:border-zinc-200" : "border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-700"}`}
                  min="0"
                  max="59"
                  disabled={!specificTime}
                />
              </div>
              <input
                  type="checkbox"
                  checked={specificTime}
                  onChange={() => setSpecificTime(!specificTime)}
                  className="ml-6 rounded-full"
                />
            </div>
            <div className="flex flex-row items-center justify-between mt-4">
              <span className="material-icons text-gray-400 dark:text-zinc-200">
                bookmark_border
              </span>
              <div className="flex flex-wrap gap-2">
                {labels.map((lbl, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedLabel(lbl.name)}
                    className="flex items-center justify-center cursor-pointer rounded"
                    style={{
                      backgroundColor: selectedLabel === lbl.name ? lbl.color : `${lbl.color}80`,
                      padding: "0.5rem 1rem",
                    }}
                  >
                    <span className="text-white">{lbl.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <footer className="flex justify-end border-t p-3 mt-5">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded text-white"
          >
            {t('save')}
          </button>
        </footer>
      </form>
    </div>
  );
}