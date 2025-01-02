import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalContext from "../context/GlobalContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db, auth } from "../firebase";
import { getWeeksInInterval } from "../util";
import {
  doc,
  setDoc,
  collection,
  query,
  getDocs,
  writeBatch,
  where,
  deleteDoc,
} from "firebase/firestore";
import it from "date-fns/locale/it";
import dayjs from "dayjs"; // Ensure dayjs is imported
import RepeatEventModal from "./RepeatEventModal"; // Import RepeatEventModal

function EditConfirmationModal({ onClose, onEditSingle, onEditAll }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-52">
      <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl p-6 z-52">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Modifica Evento
        </h2>
        <p className="mb-4 text-white">
          Vuoi salvare le modifiche per l'evento corrente o tutte le sue
          occorrenze?
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded mr-2"
          >
            Cancella
          </button>
          <button
            onClick={onEditSingle}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white mr-2"
          >
            Solo Corrente
          </button>
          <button
            onClick={onEditAll}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white"
          >
            Modifica tutti
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ onClose, onDeleteSingle, onDeleteAll }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-52">
      <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl p-6 z-52">
        <h2 className="text-lg font-semibold mb-4 text-white">Elimina Event</h2>
        <p className="mb-4 text-white">
          Vuoi eliminare l'evento corrente o tutte le sue occorrenze?
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded mr-2"
          >
            Cancella
          </button>
          <button
            onClick={onDeleteSingle}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white mr-2"
          >
            Solo Corrente
          </button>
          <button
            onClick={onDeleteAll}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white"
          >
            Elimina tutti
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [selectedLabel, setSelectedLabel] = useState("");
  const [specificTime, setSpecificTime] = useState(false);
  const [postponable, setPostponable] = useState(false);
  const [date, setDate] = useState(daySelected.toDate());
  const [time, setTime] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatOptions, setRepeatOptions] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState(null);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || ""); // Ensure description can be empty
      setSelectedLabel(selectedEvent.label);
      setDate(new Date(selectedEvent.day)); // Set the date from the selected event
      setIsChecked(selectedEvent.checked);
      if (selectedEvent.time) {
        setSpecificTime(true);
        setTime(selectedEvent.time); // Set time directly from the selected event
      } else {
        setSpecificTime(false);
        setTime("00:00");
      }
    } else {
      resetForm();
    }
  }, [selectedEvent]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedLabel(""); // No label selected by default
    setSpecificTime(false);
    setPostponable(false);
    setDate(daySelected.toDate());

    const now = new Date();
    const closestQuarterHour = new Date(
      Math.round(now.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000)
    );
    const hours = closestQuarterHour.getHours().toString().padStart(2, "0");
    const minutes = closestQuarterHour.getMinutes().toString().padStart(2, "0");

    setTime(`${hours}:${minutes}`);
    setIsChecked(false);
  };

  function generateRandomId() {
    return Math.random().toString().slice(2, 9);
  }

  useEffect(() => {
    console.log(showEditConfirmation);
  }, [showEditConfirmation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const repeatId = generateRandomId();
    const calendarEvent = {
      title: title,
      description: description || "", // Ensure description can be empty
      label: selectedLabel,
      calendarId: 1,
      day: date.getTime(),
      postponable: postponable,
      id: selectedEvent ? selectedEvent.id : Date.now().toString(),
      checked: isChecked,
      repeat: repeatOptions ? repeatId : null,
      time: specificTime ? time : null, // Store time as a string "hh:mm"
      userId: auth.currentUser.uid,
    };
  
    try {
      if (selectedEvent && selectedEvent.postponable) {
        // Duplicate the event if it is postponable
        const duplicatedEvent = { ...calendarEvent, id: Date.now().toString(), checked: false, postponable: true };
        const duplicatedEventRef = doc(
          db,
          `users/${auth.currentUser.uid}/events`,
          duplicatedEvent.id
        );
        await setDoc(duplicatedEventRef, duplicatedEvent);
        dispatchCalEvent({ type: "push", payload: duplicatedEvent });
      } else {
        const eventRef = doc(
          db,
          `users/${auth.currentUser.uid}/events`,
          calendarEvent.id
        );
        await setDoc(eventRef, calendarEvent);
  
        if (selectedEvent && selectedEvent.repeat) {
          const eventUpdatedRepeted = { ...calendarEvent, repeat: selectedEvent.repeat };
          dispatchCalEvent({ type: "update", payload: eventUpdatedRepeted });
          setDeleteTargetEvent(eventUpdatedRepeted);
          setShowEditConfirmation(true);
          return;
        } else if (selectedEvent) {
          dispatchCalEvent({ type: "update", payload: calendarEvent });
        } else {
          dispatchCalEvent({ type: "push", payload: calendarEvent });
        }
      }
  
      if (repeatOptions) {
        await createRepeatedEvents(calendarEvent, repeatOptions);
      }
  
      setShowEventModal(false);
      setSelectedEvent(null); // Reset selectedEvent state
      resetForm(); // Reset the form after closing the modal
    } catch (error) {
      console.error("Error saving document: ", error);
      resetForm(); // Reset the form after closing the modal
    }
  };

  async function createRepeatedEvents(event, repeatOptions) {
    const { endDate, endMonth, endYear, customRepeat } = repeatOptions;
    const { interval, daysOfWeek, frequency } = customRepeat;
    const startMonth = dayjs(event.day).month() + 1;
    const startYear = dayjs(event.day).year();

    const batch = writeBatch(db); // Use batch to group multiple operations
    if (frequency === "week") {
      const weeksMatrix = getWeeksInInterval(
        startMonth,
        startYear,
        endMonth,
        endYear,
        date,
        endDate
      );
      console.log("Weeks matrix", weeksMatrix);
      let eventCount = 0;
      for (
        let weekIndex = 0;
        weekIndex < weeksMatrix.length;
        weekIndex += interval
      ) {
        for (let i = 0; i < daysOfWeek.length; i++) {
          const day = weeksMatrix[weekIndex][daysOfWeek[i][0]];
          const eventDate = dayjs(day, "ddd, D MMM, YYYY").toDate();
          console.log("Event date", eventDate);
          if (
            day === dayjs(event.day).locale("en").format("ddd, D MMM, YYYY")
          ) {
            continue;
          }

          const repeatedEvent = {
            ...event,
            day: eventDate.getTime(),
            id: `${event.id}-${eventCount}`,
          };

          const eventRef = doc(
            db,
            `users/${auth.currentUser.uid}/events`,
            repeatedEvent.id
          );
          batch.set(eventRef, repeatedEvent); // Add to batch
          dispatchCalEvent({ type: "push", payload: repeatedEvent });
          eventCount++;
        }
      }
    } else if (repeatOptions.repeatType === "monthly") {
      let currentMonth = startMonth;
      let currentYear = startYear;
      const originalDay = dayjs(event.day).date();

      while (
        currentYear < endYear ||
        (currentYear === endYear && currentMonth <= endMonth)
      ) {
        let eventDay = originalDay;
        const daysInMonth = dayjs(
          new Date(currentYear, currentMonth)
        ).daysInMonth();

        if (originalDay > daysInMonth) {
          eventDay = daysInMonth;
        }

        const eventDate = dayjs(
          new Date(currentYear, currentMonth, eventDay)
        ).toDate();

        if (dayjs(eventDate).isAfter(dayjs(endDate))) {
          break;
        }

        const repeatedEvent = {
          ...event,
          day: eventDate.getTime(),
          id: `${event.id}-${currentYear}-${currentMonth}`,
        };

        const eventRef = doc(
          db,
          `users/${auth.currentUser.uid}/events`,
          repeatedEvent.id
        );
        batch.set(eventRef, repeatedEvent); // Add to batch
        dispatchCalEvent({ type: "push", payload: repeatedEvent });

        if (currentMonth === 11) {
          currentMonth = 0;
          currentYear++;
        } else {
          currentMonth++;
        }
      }
    } else if (repeatOptions.repeatType === "yearly") {
      let currentYear = startYear + 1;
      const originalDay = dayjs(event.day).date();
      const originalMonth = dayjs(event.day).month();

      while (currentYear <= endYear) {
        const eventDate = dayjs(
          new Date(currentYear, originalMonth, originalDay)
        ).toDate();

        const repeatedEvent = {
          ...event,
          day: eventDate.getTime(),
          id: `${event.id}-${currentYear}`,
        };

        const eventRef = doc(
          db,
          `users/${auth.currentUser.uid}/events`,
          repeatedEvent.id
        );
        batch.set(eventRef, repeatedEvent); // Add to batch
        dispatchCalEvent({ type: "push", payload: repeatedEvent });

        currentYear++;
      }
    }

    await batch.commit(); // Commit the batch
    handleClose();
  }

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
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        options.push(
          <option key={timeString} value={timeString}>
            {timeString}
          </option>
        );
      }
    }
    return options;
  };

  useEffect(() => {
    console.log(showDeleteConfirmation);
  }, [showDeleteConfirmation]);

  const handleDeleteEvent = (event) => {
    console.log("Delete event triggered:", event);
    if (event.repeat) {
      setDeleteTargetEvent(event);
      setShowDeleteConfirmation(!showDeleteConfirmation);
      console.log("Show delete confirmation", showDeleteConfirmation);
    } else {
      deleteEvent(event);
      handleClose();
    }
  };

  const deleteEvent = async (event) => {
    console.log("Deleting event:", event);
    try {
      const eventRef = doc(
        db,
        `users/${auth.currentUser.uid}/events`,
        event.id
      );
      await deleteDoc(eventRef);
      dispatchCalEvent({ type: "delete", payload: { id: event.id } });
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  const deleteAllEvents = async (repeatId) => {
    console.log("Deleting all events with repeatId:", repeatId);
    try {
      const eventsQuery = query(
        collection(db, `users/${auth.currentUser.uid}/events`),
        where("repeat", "==", repeatId)
      );
      const querySnapshot = await getDocs(eventsQuery);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
        dispatchCalEvent({ type: "delete", payload: { id: doc.id } });
      });
    } catch (error) {
      console.error("Error deleting events: ", error);
    }
  };

  const handleDeleteSingle = async () => {
    console.log("Delete single event");
    if (deleteTargetEvent) {
      await deleteEvent(deleteTargetEvent);
      setShowDeleteConfirmation(false);
      setDeleteTargetEvent(null);
      handleClose();
    }
  };

  const handleDeleteAll = async () => {
    console.log("Delete all events");
    if (deleteTargetEvent) {
      await deleteAllEvents(deleteTargetEvent.repeat);
      setShowDeleteConfirmation(false);
      setDeleteTargetEvent(null);
      handleClose();
    }
  };

  const saveEvent = async (event) => {
    try {
      const eventRef = doc(
        db,
        `users/${auth.currentUser.uid}/events`,
        event.id
      );
      await setDoc(eventRef, event);
      dispatchCalEvent({ type: "update", payload: event });
    } catch (error) {
      console.error("Error saving event: ", error);
    }
  };

  const saveAllEvents = async (event, repeatId) => {
    try {
      const batch = writeBatch(db);
      console.log(event);
      const eventsQuery = query(
        collection(db, `users/${auth.currentUser.uid}/events`),
        where("repeat", "==", repeatId)
      );
      const querySnapshot = await getDocs(eventsQuery);
      const updatedEvents = [];
      querySnapshot.forEach((doc) => {
        console.log("Updating event:", doc.data());
        const oldEvent = doc.data();
        const eventRef = doc.ref;
        const updatedEvent = { ...event, day: oldEvent.day, id: oldEvent.id }; // Ensure the id is preserved
        batch.update(eventRef, updatedEvent);
        updatedEvents.push(updatedEvent);
      });
      await batch.commit();
      updatedEvents.forEach((updatedEvent) => {
        dispatchCalEvent({ type: "update", payload: updatedEvent });
      });
    } catch (error) {
      console.error("Error saving events: ", error);
    }
  };

  const handleEditSingle = async () => {
    if (deleteTargetEvent) {
      await saveEvent(deleteTargetEvent);
      setShowEditConfirmation(false);
      setDeleteTargetEvent(null);
      handleClose();
    }
  };

  const handleEditAll = async () => {
    if (deleteTargetEvent) {
      console.log("Edit all events");
      await saveAllEvents(deleteTargetEvent, deleteTargetEvent.repeat);
      setShowEditConfirmation(false);
      setDeleteTargetEvent(null);
      handleClose();
    }
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-51 dark:bg-zinc-800 dark:bg-opacity-75">
      {showRepeatModal && (
        <RepeatEventModal
          onClose={() => setShowRepeatModal(false)}
          onSave={(options) => setRepeatOptions(options)}
          selectedDate={date}
          repeatType={repeatOptions ? repeatOptions.repeatType : "no_repeat"}
        />
      )}
      {showDeleteConfirmation === true && (
        <DeleteConfirmationModal
          onClose={() => setShowDeleteConfirmation(false)}
          onDeleteSingle={handleDeleteSingle}
          onDeleteAll={handleDeleteAll}
        />
      )}
      {showEditConfirmation === true && (
        <EditConfirmationModal
          onClose={() => setShowEditConfirmation(false)}
          onEditSingle={handleEditSingle}
          onEditAll={handleEditAll}
        />
      )}
      <form
        className="bg-white dark:bg-zinc-950 rounded-4xl shadow-2xl w-2/5 z-51"
        onSubmit={handleSubmit}
      >
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center rounded-t-4xl">
          <span className="material-icons-outlined text-gray-400 dark:text-zinc-200 ml-4">
            drag_handle
          </span>
          <div>
            {selectedEvent && (
              <span
                onClick={() => {
                  handleDeleteEvent(selectedEvent);
                }}
                className="material-icons-outlined text-gray-400 dark:text-zinc-200 cursor-pointer mr-6"
              >
                delete
              </span>
            )}
            <button
              onClick={handleClose}
              className="material-icons-outlined text-gray-400 dark:text-zinc-200 mr-4 mt-1"
            >
              close
            </button>
          </div>
        </header>
        <div className="p-3 mt-2">
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                edit
              </span>
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  name="title"
                  placeholder={t("add_title")}
                  value={title}
                  disabled={isChecked && postponable}
                  required
                  className="ml-6 mr-6 pt-3 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold pb-2 w-60 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="flex items-center -mt-3 ml-32">
                  <input
                    type="checkbox"
                    checked={postponable}
                    onChange={() => setPostponable(!postponable)}
                    className="mr-2 rounded-full"
                  />
                  <label className="text-gray-600 dark:text-zinc-200">
                    {t("postponable")}
                  </label>
                </div>
              </div>
            </div>
            <textarea
              name="description"
              placeholder={t("add_description")}
              value={description}
              rows="4"
              disabled={isChecked && postponable}
              className="ml-12 pt-3 border-0 text-gray-600 dark:text-zinc-200 pb-2 w-96 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 bg-gray-100 dark:bg-zinc-700 rounded"
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center flex-row mt-5">
              <div className="flex items-center">
                <span className="material-icons text-gray-400 dark:text-zinc-200">
                  event
                </span>
              </div>
              <div className="flex items-center gap-x-2 ml-6 justify-between">
                <div>
                  <DatePicker
                    selected={date}
                    onChange={(date) => setDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-32 p-2 ml-5 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                    disabled={isChecked && postponable}
                    locale={it}
                  />
                  <div className="flex justify-end mt-4">
                    <select
                      value={
                        repeatOptions ? repeatOptions.repeatType : "no_repeat"
                      }
                      disabled={isChecked && postponable}
                      onChange={(e) => {
                        if (e.target.value !== "no_repeat") {
                          setShowRepeatModal(true);
                          setRepeatOptions({ repeatType: e.target.value });
                        } else {
                          setRepeatOptions(null);
                        }
                      }}
                      className="bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-800 px-8 rounded-2xl text-white mr-2"
                    >
                      <option value="no_repeat">{t("no_repeat")}</option>
                      <option value="monthly">{t("monthly")}</option>
                      <option value="yearly">{t("yearly")}</option>
                      <option value="custom">{t("custom")}</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center flex-row ml-20">
                  <span className="material-icons text-gray-400 dark:text-zinc-200">
                    access_time
                  </span>
                  <label className="ml-2 text-gray-600 dark:text-zinc-200">
                    {t("access_time")}
                  </label>

                  <div className="flex items-center gap-x-2 ml-2">
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={`custom-scrollbar w-32 p-2 border rounded ${
                        specificTime
                          ? "border-black dark:border-zinc-200"
                          : "border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-700"
                      }`}
                      disabled={!specificTime || (isChecked && postponable)}
                      >
                      {generateTimeOptions()}
                    </select>
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={specificTime}
                onChange={() => setSpecificTime(!specificTime)}
                className="ml-4 rounded-full"
                disabled={isChecked && postponable}
                />
            </div>
            <div className="flex flex-row items-center justify-between mt-4 ml-2 mr-6">
              <div className="grid grid-cols-3 gap-x-16 gap-y-5">
                {sortedLabels.map((lbl, i) => (
                  <div
                    key={i}
                    onClick={() => (!isChecked || !postponable) && setSelectedLabel(lbl.name)}                    className="flex items-center justify-center cursor-pointer rounded w-40"
                    style={{
                      backgroundColor:
                        selectedLabel === lbl.name
                          ? `${lbl.color}80`
                          : lbl.color,
                      border:
                        selectedLabel === lbl.name
                          ? `2px solid white`
                          : "2px solid transparent",
                      padding: "0.5rem 0", // Double the width
                    }}
                  >
                    <span className="text-black font-bold text-sm">
                      {lbl.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <footer className="flex justify-end p-3 mt-5 rounded-b-4xl">
          <button
            type="submit"
            className="hover:bg-zinc-700 px-6 py-2 rounded-4xl text-white mr-4 mb-1"
            disabled={(isChecked && postponable) || selectedLabel === ""}          >
            {t("save")}
          </button>
        </footer>
      </form>
    </div>
  );
}
