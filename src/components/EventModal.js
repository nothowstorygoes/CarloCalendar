import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalContext from "../context/GlobalContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db, auth } from "../firebase";
import { getWeeksInInterval } from "../util";
import Spinner from "../assets/spinner";
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

function EditConfirmationModal({ onClose, onEditSingle, onEditFuture }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-52">
      <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl p-6 z-52">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Modifica Evento
        </h2>
        <p className="mb-4 text-white">
          Vuoi salvare le modifiche per l'evento corrente o tutte le sue
          occorrenze future?
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
            onClick={onEditFuture}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white mr-2"
          >
            Modifica solo futuri
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ onClose, onDeleteSingle, onDeleteFuture }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-52">
      <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl p-6 z-52">
        <h2 className="text-lg font-semibold mb-4 text-white">Elimina Event</h2>
        <p className="mb-4 text-white">
          Vuoi eliminare l'evento corrente o tutte le sue occorrenze future?
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
            onClick={onDeleteFuture}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white mr-2"
          >
            Elimina solo futuri
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
    calendars,
  } = useContext(GlobalContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedCalendar, setSelectedCalendar] = useState("");
  const [specificTime, setSpecificTime] = useState(false);
  const [postponable, setPostponable] = useState(false);
  const [showLabelWarning, setShowLabelWarning] = useState(false);
  const [date, setDate] = useState(daySelected.toDate());
  const [time, setTime] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatOptions, setRepeatOptions] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState(null);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [repeatTypeString, setRepeatTypeString] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || ""); // Ensure description can be empty
      setSelectedLabel(selectedEvent.label);
      setPostponable(selectedEvent.postponable);
      setSelectedCalendar(selectedEvent.calendarId);
      setRepeatTypeString(selectedEvent.repeatType);
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
    setSelectedCalendar(""); // No calendar selected by default
    setPostponable(false);
    setRepeatTypeString("");
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

  const getRepeatTypeString = (repeatOptions) => {
    if (repeatOptions.repeatType === "custom" && repeatOptions.customRepeat) {
      const { interval, frequency, daysOfWeek } = repeatOptions.customRepeat;
      console.log(frequency);
      let frequencyTranslation;
      switch (frequency) {
        case "week":
          frequencyTranslation = "settimane";
          break;
        case "monthly":
          frequencyTranslation = "mesi";
          break;
        case "yearly":
          frequencyTranslation = "anni";
          break;
        case "monthlyCustom":
          frequencyTranslation = "mesi";
          break;
        default:
          frequencyTranslation = "";
      }

      const daysOfWeekTranslation = {
        0: "lunedì",
        1: "martedì",
        2: "mercoledì",
        3: "giovedì",
        4: "venerdì",
        5: "sabato",
        6: "domenica",
      };

      let daysOfWeekString = "";
      if (daysOfWeek && daysOfWeek.length > 0) {
        const daysOfWeekNames = daysOfWeek.map(
          (day) => daysOfWeekTranslation[day[0]]
        );
        daysOfWeekString = ` ( ${daysOfWeekNames.join(" ")} )`;
      }

      return `Ogni ${interval} ${frequencyTranslation}${daysOfWeekString}`;
    } else if (repeatOptions.repeatType === "yearly") {
      return `Ogni anno`;
    } else if (repeatOptions.repeatType === "monthly") {
      return "Ogni mese";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (selectedLabel === "") {
      setShowLabelWarning(true);
      return;
    }
    setShowLabelWarning(false);
    const repeatId = generateRandomId();
    console.log(repeatOptions);
    const calendarEvent = {
      title: title,
      description: description || "", // Ensure description can be empty
      label: selectedLabel,
      calendarId: selectedCalendar,
      day: date.getTime(),
      postponable: postponable,
      id: selectedEvent ? selectedEvent.id : Date.now().toString(),
      checked: isChecked,
      repeat: repeatOptions ? repeatId : null,
      repeatType: repeatOptions ? getRepeatTypeString(repeatOptions) : null,
      time: specificTime ? time : null, // Store time as a string "hh:mm"
      userId: auth.currentUser.uid,
    };
    console.log(calendarEvent);
    try {
      if (
        selectedEvent &&
        selectedEvent.postponable &&
        selectedEvent.day !== calendarEvent.day
      ) {
        // Duplicate the event if it is postponable
        const duplicatedEvent = {
          ...calendarEvent,
          id: Date.now().toString(),
          checked: false,
          postponable: true,
        };
        const duplicatedEventRef = doc(
          db,
          `users/${auth.currentUser.uid}/events`,
          duplicatedEvent.id
        );
        await setDoc(duplicatedEventRef, duplicatedEvent);
        dispatchCalEvent({ type: "push", payload: duplicatedEvent });

        // Update the original event to set the checked property to true
        const updatedPostponableEvent = {
          ...selectedEvent,
          checked: true,
        };
        const originalEventRef = doc(
          db,
          `users/${auth.currentUser.uid}/events`,
          selectedEvent.id
        );
        await setDoc(originalEventRef, updatedPostponableEvent);
        dispatchCalEvent({ type: "update", payload: updatedPostponableEvent });
      } else {
        if (selectedEvent && selectedEvent.repeat) {
          const eventUpdatedRepeted = {
            ...calendarEvent,
            repeat: selectedEvent.repeat,
          };
          console.log("lol", eventUpdatedRepeted);
          dispatchCalEvent({ type: "update", payload: eventUpdatedRepeted });
          setDeleteTargetEvent(eventUpdatedRepeted);
          setShowEditConfirmation(true);
          return;
        } else if (selectedEvent) {
          dispatchCalEvent({ type: "update", payload: calendarEvent });
          const duplicatedEventRef = doc(
            db,
            `users/${auth.currentUser.uid}/events`,
            calendarEvent.id
          );
          await setDoc(duplicatedEventRef, calendarEvent);
        } else {
          const duplicatedEventRef = doc(
            db,
            `users/${auth.currentUser.uid}/events`,
            calendarEvent.id
          );
          await setDoc(duplicatedEventRef, calendarEvent);
          dispatchCalEvent({ type: "push", payload: calendarEvent });
        }
      }

      if (repeatOptions) {
        console.log("Creating repeated events");
        await createRepeatedEvents(calendarEvent, repeatOptions);
      }

      setShowEventModal(false);
      setSelectedEvent(null); // Reset selectedEvent state
      resetForm(); // Reset the form after closing the modal
    } catch (error) {
      console.error("Error saving document: ", error);
      resetForm(); // Reset the form after closing the modal
    }
    setLoading(false);
  };

  async function createRepeatedEvents(event, repeatOptions) {
    const { endDate, endMonth, endYear, customRepeat, endOption, occurrences } =
      repeatOptions;
    const { interval, daysOfWeek, frequency, dayOfMonth } = customRepeat;
    const startMonth = dayjs(event.day).month() + 1;
    console.log(dayOfMonth);
    const startYear = dayjs(event.day).year();
    console.log(repeatOptions);
    const batch = writeBatch(db); // Use batch to group multiple operations

    let calculatedEndYear = endYear;
    let calculatedEndDate = endDate;
    let calculatedEndMonth = endMonth;

    console.log("End option", endOption);
    console.log(calculatedEndYear, calculatedEndDate);

    if (endOption === "never") {
      calculatedEndYear = startYear + 20;
      calculatedEndDate = dayjs(event.day).add(20, "year").toDate();
    } else if (endOption === "occurrences") {
      console.log(occurrences, interval, frequency);
      let freq;
      switch (frequency) {
        case "monthly":
          freq = "month";
          break;
        case "yearly":
          freq = "year";
          break;
        case "week":
          freq = "week";
          break;
        case "monthlyCustom":
          freq = "month";
          break;
        default:
          break;
      }
      calculatedEndDate = dayjs(event.day)
        .add(parseInt(occurrences, 10) * parseInt(interval, 10), freq)
        .toDate();
      calculatedEndMonth = dayjs(calculatedEndDate).month();
      calculatedEndYear = dayjs(calculatedEndDate).year();
    }

    console.log(calculatedEndYear, calculatedEndDate);

    if (frequency === "week") {
      const weeksMatrix = getWeeksInInterval(
        startMonth,
        startYear,
        endMonth,
        calculatedEndYear,
        date,
        calculatedEndDate
      );
      let eventCount = 0;
      setRepeatTypeString(
        `Ogni ${interval} settimane, ${daysOfWeek.length} giorni`
      );
      for (
        let weekIndex = 0;
        weekIndex < weeksMatrix.length;
        weekIndex += parseInt(interval, 10)
      ) {
        for (let i = 0; i < daysOfWeek.length; i++) {
          const dayIndex = daysOfWeek[i][0];

          console.log(weekIndex, dayIndex);
          const day = weeksMatrix[weekIndex][dayIndex];
          if (weekIndex >= weeksMatrix.length) {
            console.error(
              `Invalid weekIndex: ${weekIndex} out of ${weeksMatrix.length}`
            );
            continue;
          }
          if (dayIndex >= weeksMatrix[weekIndex].length) {
            console.error(
              `Invalid dayIndex: ${dayIndex} out of ${weeksMatrix[weekIndex].length}`
            );
            continue;
          }
          if (!day) {
            console.error(
              `Undefined day at weekIndex=${weekIndex}, dayIndex=${dayIndex}`
            );
            continue;
          }
          console.log("Day", day);
          const eventDate = dayjs(day, "ddd, D MMM, YYYY").toDate();
          console.log("Event date", eventDate);
          if (
            day === dayjs(event.day).locale("en").format("ddd, D MMM, YYYY") ||
            eventDate < dayjs(event.day).toDate() // Skip if eventDate is before startDate
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
    } else if (frequency === "monthlyCustom") {
      let currentMonth = startMonth - 1;
      let currentYear = startYear;
      const originalDay = dayjs(event.day).date();
      const originalMonth = dayjs(event.day).month();
      const originalYear = dayjs(event.day).year();
      while (
        currentYear < calculatedEndYear ||
        (currentYear === calculatedEndYear &&
          currentMonth <= calculatedEndMonth)
      ) {
        let eventDay = dayOfMonth;
        const daysInMonth = dayjs(
          new Date(currentYear, currentMonth)
        ).daysInMonth();

        if (originalDay > daysInMonth) {
          eventDay = daysInMonth;
        }

        const eventDate = dayjs(
          new Date(currentYear, currentMonth, eventDay)
        ).toDate();
        console.log(eventDate);
        if (dayjs(eventDate).isAfter(dayjs(calculatedEndDate))) {
          break;
        }

        if (
          eventDay === originalDay &&
          currentMonth === originalMonth &&
          currentYear === originalYear
        ) {
          currentMonth += parseInt(interval, 10); // Increment by custom interval
          if (currentMonth > 11) {
            currentMonth -= 12;
            currentYear++;
          }
          continue;
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

        currentMonth += parseInt(interval, 10); // Increment by custom interval
        if (currentMonth > 11) {
          currentMonth -= 12;
          currentYear++;
        }
      }
    } else if (repeatOptions.repeatType === "monthly") {
      let currentMonth = startMonth;
      let currentYear = startYear;
      const originalDay = dayjs(event.day).date();
      console.log(calculatedEndDate);
      console.log(calculatedEndMonth);
      console.log(currentYear, currentMonth, endYear, endMonth);
      while (
        currentYear < calculatedEndYear ||
        (currentYear === calculatedEndYear &&
          currentMonth <= calculatedEndMonth)
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
        console.log(eventDate);
        if (dayjs(eventDate).isAfter(dayjs(calculatedEndDate))) {
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

      while (currentYear <= calculatedEndYear) {
        const eventDate = dayjs(
          new Date(currentYear, originalMonth, originalDay)
        ).toDate();
        console.log(eventDate);
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

  const deleteAllFuture = async (repeatId) => {
    console.log("Deleting all future events with repeatId:", repeatId);
    try {
      const eventsQuery = query(
        collection(db, `users/${auth.currentUser.uid}/events`),
        where("repeat", "==", repeatId)
      );
      const querySnapshot = await getDocs(eventsQuery);
      const batch = writeBatch(db); // Use batch to group multiple operations
      querySnapshot.forEach((doc) => {
        let event = doc.data();
        if (event.checked === false) {
          batch.delete(doc.ref);
          dispatchCalEvent({ type: "delete", payload: { id: event.id } });
        }
      });
      await batch.commit(); // Commit the batch
    } catch (error) {
      console.error("Error deleting future events: ", error);
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

  const handleDeleteFuture = async () => {
    console.log("Delete all future events");
    if (deleteTargetEvent) {
      await deleteAllFuture(deleteTargetEvent.repeat);
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

  const saveFutureEvents = async (event, repeatId) => {
    try {
      const batch = writeBatch(db);
      console.log(event);
      const eventsQuery = query(
        collection(db, `users/${auth.currentUser.uid}/events`),
        where("repeat", "==", repeatId),
        where("checked", "==", false)
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

  const handleEditFuture = async () => {
    if (deleteTargetEvent) {
      console.log("Edit future events");
      await saveFutureEvents(deleteTargetEvent, deleteTargetEvent.repeat);
      setShowEditConfirmation(false);
      setDeleteTargetEvent(null);
      handleClose();
    }
  };

  const sortedCalendar = [...calendars].sort((a, b) => a.id - b.id);
  console.log(sortedCalendar);

  const handleRepeatModalClose = () => {
    setShowRepeatModal(false);
    setRepeatOptions(null); // Reset repeat options to "no_repeat"
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-51 dark:bg-zinc-800 dark:bg-opacity-75">
      {showRepeatModal && (
        <RepeatEventModal
          onClose={handleRepeatModalClose}
          onSave={(options) => setRepeatOptions(options)}
          selectedDate={date}
          repeatType={repeatOptions ? repeatOptions.repeatType : "no_repeat"}
          setShowRepeatModal={setShowRepeatModal}
        />
      )}
      {showDeleteConfirmation === true && (
        <DeleteConfirmationModal
          onClose={() => setShowDeleteConfirmation(false)}
          onDeleteSingle={handleDeleteSingle}
          onDeleteFuture={handleDeleteFuture}
        />
      )}
      {showEditConfirmation === true && (
        <EditConfirmationModal
          onClose={() => setShowEditConfirmation(false)}
          onEditSingle={handleEditSingle}
          onEditFuture={handleEditFuture}
        />
      )}
      <form
        className="bg-white dark:bg-zinc-950 rounded-4xl w-[24rem] shadow-2xl md:w-4/5 z-51"
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
            <div className="flex flex-row items-center mb-8 mt-2 md:mt-0">
              <p className="text-black dark:text-white ml-16 md:ml-28 w-20">
                Scegli un calendario:
              </p>

              <div className="grid grid-cols-4 gap-x-10 gap-y-5 items-center ml-16 hidden md:!grid">
                {sortedCalendar.map((cal, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedCalendar(cal.id)}
                    className={`flex items-center justify-center cursor-pointer rounded w-40 h-8 border ${
                      selectedCalendar === cal.id
                        ? "bg-blue-700 border-blue-900 border-2"
                        : "bg-blue-300 border-none"
                    }`}
                  >
                    <span className="text-black font-bold text-sm">
                      {cal.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="md:hidden ml-16">
                <select
                  value={selectedCalendar}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                  className="border rounded-2xl p-2 dark:bg-zinc-700 dark:text-white px-4"
                >
                  <option>Scegli</option>
                  {sortedCalendar.map((cal, i) => (
                    <option key={i} value={cal.id}>
                      {cal.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center w-screen">
              <div className="flex flex-row items-center md:ml-12">
                <span className="material-icons-outlined text-gray-400 dark:text-zinc-200  ml-2 md:ml-3 -mt-16 md:mt-0">
                  edit
                </span>
                <div className="flex flex-col items-center ml-10">
                  <div className="flex flex-col md:flex-row md:items-center items-start">
                    <input
                      type="text"
                      name="title"
                      placeholder={t("add_title")}
                      value={title}
                      disabled={isChecked && postponable}
                      required
                      className="md:-ml-6 md:mr-6 pt-3 border-0 text-gray-600 dark:text-zinc-200 w-64 text-xl font-semibold pb-2 md:w-60 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <div>
                      <input
                        type="checkbox"
                        checked={postponable}
                        onChange={() => setPostponable(!postponable)}
                        className="md:mr-2 rounded-full"
                      />
                      <label className="text-gray-600 dark:text-zinc-200 ml-2 md:ml-0">
                        {t("postponable")}
                      </label>
                    </div>
                  </div>
                  <textarea
                    name="description"
                    placeholder={t("add_description")}
                    value={description}
                    rows="4"
                    disabled={isChecked && postponable}
                    className="mt-4 md:mt-0 pt-3 text-gray-600 dark:text-zinc-200 pb-2 w-64 md:w-96 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 bg-gray-100 dark:bg-zinc-700 rounded"
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex md:items-center flex-col md:flex-row md:ml-56 mt-6 md:mt-0">
                <div className="flex flex-row">
                  <div className="flex items-center">
                    <span className="material-icons text-gray-400 dark:text-zinc-200 ml-2 md:ml-0">
                      event
                    </span>
                  </div>
                  <div className="flex items-center gap-x-2 ml-9 md:ml-6 justify-between">
                    <div>
                      <DatePicker
                        selected={date}
                        onChange={(date) => setDate(date)}
                        dateFormat="dd/MM/yyyy"
                        className="w-38 md:w-32 p-2 md:ml-5 border rounded-2xl border-black dark:border-zinc-600 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                        disabled={isChecked && postponable}
                        locale={it}
                      />
                      <div className="flex md:justify-end mt-4">
                        <select
                          value={
                            repeatOptions
                              ? repeatOptions.repeatType
                              : "no_repeat"
                          }
                          disabled={isChecked && postponable}
                          onChange={(e) => {
                            if (e.target.value !== "no_repeat") {
                              setShowRepeatModal(true);
                              setRepeatOptions({
                                repeatType: e.target.value,
                              });
                            } else {
                              setRepeatOptions(null);
                            }
                          }}
                          className="w-38 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-800 px-8 rounded-2xl text-white mr-2"
                        >
                          <option value="no_repeat">{t("no_repeat")}</option>
                          <option value="monthly">{t("monthly")}</option>
                          <option value="yearly">{t("yearly")}</option>
                          <option value="custom">{t("custom")}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center flex-row ml-2 md:ml-5 mt-4 md:mt-0">
                  <span className="material-icons text-gray-400 dark:text-zinc-200">
                    access_time
                  </span>
                  <label className="!hidden md:!block md:ml-2 text-gray-600 dark:text-zinc-200">
                    {t("access_time")}
                  </label>

                  <div className="flex items-center gap-x-2 ml-9 md:ml-2">
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={`custom-scrollbar w-36 md:w-32 p-2 border rounded-2xl ${
                        specificTime
                          ? "border-black dark:border-zinc-200"
                          : "border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-700"
                      }`}
                      disabled={!specificTime || (isChecked && postponable)}
                    >
                      {generateTimeOptions()}
                    </select>
                  </div>
                  <input
                    type="checkbox"
                    checked={specificTime}
                    onChange={() => setSpecificTime(!specificTime)}
                    className="ml-4 rounded-full"
                    disabled={isChecked && postponable}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between mt-4 ml-2 mr-6">
              <div className="grid grid-cols-6 gap-x-10 gap-y-5 ml-6 hidden md:!grid">
                {labels
                  .filter((label) => label.calendarId === selectedCalendar)
                  .sort((a, b) => a.code - b.code)
                  .map((lbl, i) => (
                    <div
                      key={i}
                      onClick={() =>
                        (!isChecked || !postponable) &&
                        setSelectedLabel(lbl.name)
                      }
                      className="flex items-center justify-center cursor-pointer rounded w-40 h-8"
                      style={{
                        backgroundColor:
                          selectedLabel === lbl.name
                            ? `${lbl.color}80`
                            : lbl.color,
                        border:
                          selectedLabel === lbl.name
                            ? `2px solid white`
                            : "2px solid transparent",
                      }}
                    >
                      <span className="text-black font-bold text-sm">
                        {lbl.name}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="md:hidden -ml-2 flex flex-row items-center">
                <p className="text-black dark:text-white w-20 mr-4 -ml-2">
                  Scegli una categoria:
                </p>
                <select
                  value={selectedLabel}
                  onChange={(e) => setSelectedLabel(e.target.value)}
                  className="border rounded-2xl p-2 px-10 dark:bg-zinc-700 dark:text-white"
                >
                  <option>Scegli</option>
                  {labels
                    .filter((label) => label.calendarId === selectedCalendar)
                    .sort((a, b) => a.code - b.code)
                    .map((lbl, i) => (
                      <option key={i} value={lbl.name}>
                        {lbl.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <footer className="flex justify-end p-3 mt-5 rounded-b-4xl">
          {showLabelWarning && (
            <p className="text-red-500 mr-6 mt-2">{t("select_a_label")}</p>
          )}
          {loading && (
            <div role="status" className="mr-10 mt-1">
              <svg
                aria-hidden="true"
                className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          )}
          <button
            type="submit"
            className="hover:bg-zinc-700 px-6 py-2 rounded-4xl text-white mr-4 mb-1"
            disabled={isChecked && postponable}
          >
            {t("save")}
          </button>
        </footer>
      </form>
    </div>
  );
}
