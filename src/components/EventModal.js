import React, { useContext, useEffect, useState } from "react";
import GlobalContext from "../context/GlobalContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function EventModal() {
  const {
    setShowEventModal,
    daySelected,
    dispatchCalEvent,
    selectedEvent,
    labels,
  } = useContext(GlobalContext);

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

  function handleSubmit(e) {
    e.preventDefault();
    const calendarEvent = {
      title,
      description,
      label: selectedLabel,
      day: date.getTime(),
      id: selectedEvent ? selectedEvent.id : Date.now(),
      checked: false,
      time: specificTime ? { hours, minutes } : null,
    };
    if (selectedEvent) {
      dispatchCalEvent({ type: "update", payload: calendarEvent });
    } else {
      dispatchCalEvent({ type: "push", payload: calendarEvent });
    }

    setShowEventModal(false);
  }

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-50 dark:bg-gray-800 dark:bg-opacity-75">
      <form className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-1/3 z-50">
        <header className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex justify-between items-center rounded-t-lg">
          <span className="material-icons-outlined text-gray-400 dark:text-gray-200">
            drag_handle
          </span>
          <div>
            {selectedEvent && (
              <span
                onClick={() => {
                  dispatchCalEvent({ type: "delete", payload: selectedEvent });
                  setShowEventModal(false);
                }}
                className="material-icons-outlined text-gray-400 dark:text-gray-200 cursor-pointer mt-1"
              >
                delete
              </span>
            )}
            <button
              onClick={() => setShowEventModal(false)}
              className="material-icons-outlined text-gray-400 dark:text-gray-200 mt-1 ml-4"
            >
              close
            </button>
          </div>
        </header>
        <div className="p-6">
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-gray-200">
                edit
              </span>
              <input
                type="text"
                name="title"
                placeholder="Add title"
                value={title}
                required
                className="ml-6 pt-3 border-0 text-gray-600 dark:text-gray-200 text-xl font-semibold pb-2 w-60 border-b-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-gray-700 rounded"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <textarea
              name="description"
              placeholder="Add description"
              value={description}
              required
              rows="4"
              className="ml-12 pt-3 border-0 text-gray-600 dark:text-gray-200 pb-2 w-96 border-b-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-blue-500 bg-gray-100 dark:bg-gray-700 rounded"
              onChange={(e) => setDescription(e.target.value)}
            />  
            <div className="flex items-center flex-row mt-5">
              <div className="flex items-center">
                <span className="material-icons text-gray-400 dark:text-gray-200">
                  event
                </span>
              </div>
              <div className="flex items-center gap-x-2 ml-6">
                <DatePicker
                  selected={date}
                  onChange={(date) => setDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-32 p-2 border rounded border-black dark:border-gray-200 bg-gray-100 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  name="hours"
                  placeholder="HH"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-16 p-2 border rounded border-black dark:border-gray-200 bg-gray-100 dark:bg-gray-700"
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
                  className="w-16 p-2 border rounded border-black dark:border-gray-200 bg-gray-100 dark:bg-gray-700"
                  min="0"
                  max="59"
                  disabled={!specificTime}
                />
                <input
                  type="checkbox"
                  checked={specificTime}
                  onChange={() => setSpecificTime(!specificTime)}
                  className="ml-6 rounded-full"
                />
              </div>
            </div>
            <div className="flex flex-row items-center justify-between mt-4">
              <span className="material-icons text-gray-400 dark:text-gray-200">
                bookmark_border
              </span>
              <div className="flex flex-wrap gap-2 mr-6">
                {labels.map((lbl, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedLabel(lbl.name)}
                    className="flex items-center justify-center cursor-pointer rounded"
                    style={{
                      backgroundColor:
                        selectedLabel === lbl.name
                          ? lbl.color
                          : `${lbl.color}80`,
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
        <footer className="flex justify-end border-t p-3 mt-5 dark:border-gray-700">
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded text-white"
          >
            Save
          </button>
        </footer>
      </form>
    </div>
  );
}