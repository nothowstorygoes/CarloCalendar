import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalContext from "../context/GlobalContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db, auth } from "../firebase";
import { collection, addDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { registerLocale } from "react-datepicker";
import enGB from "date-fns/locale/en-GB";
registerLocale("en-GB", enGB);

export default function EventModal() {
  const { t } = useTranslation();
  const {
    setShowEventModal,
    daySelected,
    dispatchCalEvent,
    selectedEvent,
    setSelectedEvent,
    labels,
  } = useContext(GlobalContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLabel, setSelectedLabel] = useState(labels[0]?.name || "");
  const [specificTime, setSpecificTime] = useState(false);
  const [date, setDate] = useState(daySelected.toDate());
  const [time, setTime] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || ""); // Ensure description can be empty
      setSelectedLabel(selectedEvent.label);
      setDate(daySelected.toDate());
      setIsChecked(selectedEvent.checked);
      if (selectedEvent.time) {
        setSpecificTime(true);
        setTime(`${selectedEvent.time.hours}:${selectedEvent.time.minutes.toString().padStart(2, "0")}`);
      }
    } else {
      resetForm();
    }
  }, [selectedEvent]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedLabel(labels[0]?.name || "");
    setSpecificTime(false);
    setDate(daySelected.toDate());
    setTime(`${new Date().getHours()}:${Math.floor(new Date().getMinutes() / 15) * 15}`);
    setIsChecked(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const [hours, minutes] = time.split(":").map(Number);
    const calendarEvent = {
      title: title,
      description: description || "", // Ensure description can be empty
      label: selectedLabel,
      day: date.getTime(),
      id: selectedEvent ? selectedEvent.id : Date.now().toString(),
      checked: isChecked,
      time: specificTime ? { hours, minutes } : null,
      userId: auth.currentUser.uid,
    };
    try {
      const eventRef = doc(
        db,
        `users/${auth.currentUser.uid}/events`,
        calendarEvent.id
      );
      await setDoc(eventRef, calendarEvent);
      if (selectedEvent) {
        dispatchCalEvent({ type: "update", payload: calendarEvent });
      } else {
        dispatchCalEvent({ type: "push", payload: calendarEvent });
      }
      setShowEventModal(false);
      setSelectedEvent(null); // Reset selectedEvent state
      resetForm(); // Reset the form after closing the modal
    } catch (error) {
      console.error("Error saving document: ", error);
      resetForm(); // Reset the form after closing the modal
    }
  };

  const handleClose = () => {
    setShowEventModal(false);
    setSelectedEvent(null); // Reset selectedEvent state
    resetForm(); // Reset the form when closing the modal
  };

  const sortedLabels = [...labels].sort((a, b) => a.code - b.code);

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        options.push(
          <option key={timeString} value={timeString}>
            {timeString}
          </option>
        );
      }
    }
    return options;
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
          <div>
            {selectedEvent && (
              <span
                onClick={() => {
                  dispatchCalEvent({ type: "delete", payload: selectedEvent });
                  handleClose();
                }}
                className="material-icons-outlined text-gray-400 dark:text-zinc-200 cursor-pointer"
              >
                delete
              </span>
            )}
            <button
              onClick={handleClose}
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
                placeholder={t("add_title")}
                value={title}
                disabled={isChecked}
                required
                className="ml-6 pt-3 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold pb-2 w-60 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <textarea
              name="description"
              placeholder={t("add_description")}
              value={description}
              rows="4"
              disabled={isChecked}
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
                  disabled={isChecked}
                  locale="en-GB"
                />
              </div>
            </div>
            <div className="flex items-center flex-row mt-5">
              <div className="flex items-center">
                <span className="material-icons text-gray-400 dark:text-zinc-200">
                  access_time
                </span>
                <label className="ml-6 text-gray-600 dark:text-zinc-200">
                  {t("access_time")}
                </label>
              </div>
              <div className="flex items-center gap-x-2 ml-4">
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`custom-scrollbar w-32 p-2 border rounded ${
                    specificTime
                      ? "border-black dark:border-zinc-200"
                      : "border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-700"
                  }`}
                  disabled={!specificTime || isChecked}
                >
                  {generateTimeOptions()}
                </select>
              </div>
              <input
                type="checkbox"
                checked={specificTime}
                onChange={() => setSpecificTime(!specificTime)}
                className="ml-6 rounded-full"
                disabled={isChecked}
              />
            </div>
            <div className="flex flex-row items-center justify-between mt-4">
              <span className="material-icons text-gray-400 dark:text-zinc-200">
                bookmark_border
              </span>
              <div className="flex flex-wrap gap-2 justify-end w-full">
                {sortedLabels.map((lbl, i) => (
                  <div
                    key={i}
                    onClick={() => !isChecked && setSelectedLabel(lbl.name)}
                    className="flex items-center justify-center cursor-pointer rounded"
                    style={{
                      backgroundColor: lbl.color,
                      border:
                        selectedLabel === lbl.name
                          ? "solid 2px white"
                          : "solid 2px transparent",
                      padding: "0.5rem 1rem",
                    }}
                  >
                    <span className="text-white">{lbl.code}</span>
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
            disabled={isChecked}
          >
            {t("save")}
          </button>
        </footer>
      </form>
    </div>
  );
}