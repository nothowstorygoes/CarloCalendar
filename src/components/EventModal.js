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
import dayjs from "dayjs"; 
import RepeatEventModal from "./RepeatEventModal"; 

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
  const [repeatTypeString, setRepeatTypeString] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Stati per Duplicazione
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const [duplicateSpecificTime, setDuplicateSpecificTime] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateRepeatOptions, setDuplicateRepeatOptions] = useState(null);
  const [showDuplicateRepeatModal, setShowDuplicateRepeatModal] = useState(false);

  // --- FILTRO I CALENDARI SCRIVIBILI ---
  // Rimuoviamo i calendari con role === 'read' dalla lista delle scelte
  const writableCalendars = calendars.filter(cal => !cal.isShared || cal.role === "write");
  const sortedCalendar = [...writableCalendars].sort((a, b) => a.id - b.id);

  // --- FUNZIONE PER TROVARE L'OWNER DEL CALENDARIO ---
  const getTargetUserId = (calId) => {
    const cal = calendars.find((c) => c.id === calId || c.docId === calId);
    return cal && cal.isShared ? cal.ownerId : auth.currentUser.uid;
  };

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || ""); 
      setSelectedLabel(selectedEvent.label);
      setPostponable(selectedEvent.postponable);
      setSelectedCalendar(selectedEvent.calendarId);
      setRepeatTypeString(selectedEvent.repeatType);
      setDate(new Date(selectedEvent.day)); 
      setIsChecked(selectedEvent.checked);
      if (selectedEvent.time) {
        setSpecificTime(true);
        setTime(selectedEvent.time); 
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
    setSelectedLabel(""); 
    setSpecificTime(false);
    setSelectedCalendar(""); 
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

  const getRepeatTypeString = (repeatOptions) => {
    if (repeatOptions.repeatType === "custom" && repeatOptions.customRepeat) {
      const { interval, frequency, daysOfWeek } = repeatOptions.customRepeat;
      let frequencyTranslation;
      switch (frequency) {
        case "week": frequencyTranslation = "settimane"; break;
        case "monthly": frequencyTranslation = "mesi"; break;
        case "yearly": frequencyTranslation = "anni"; break;
        case "monthlyCustom": frequencyTranslation = "mesi"; break;
        default: frequencyTranslation = "";
      }

      const daysOfWeekTranslation = {
        0: "lunedì", 1: "martedì", 2: "mercoledì", 3: "giovedì",
        4: "venerdì", 5: "sabato", 6: "domenica",
      };

      let daysOfWeekString = "";
      if (daysOfWeek && daysOfWeek.length > 0) {
        const daysOfWeekNames = daysOfWeek.map((day) => daysOfWeekTranslation[day[0]]);
        daysOfWeekString = ` ( ${daysOfWeekNames.join(" ")} )`;
      }

      return `Ogni ${interval} ${frequencyTranslation}${daysOfWeekString}`;
    } else if (repeatOptions.repeatType === "yearly") {
      return `Ogni anno`;
    } else if (repeatOptions.repeatType === "monthly") {
      return "Ogni mese";
    }
  };

  // --- GESTIONE ELIMINAZIONE DIRETTA ---
  const handleDeleteSingle = async () => {
    if (!selectedEvent) return;
    try {
      const targetUserId = getTargetUserId(selectedEvent.calendarId);
      const eventRef = doc(db, `users/${targetUserId}/events`, selectedEvent.id);
      await deleteDoc(eventRef);
      dispatchCalEvent({ type: "delete", payload: { id: selectedEvent.id } });
      handleClose();
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  const handleDeleteFuture = async () => {
    if (!selectedEvent || !selectedEvent.repeat) return;
    try {
      const targetUserId = getTargetUserId(selectedEvent.calendarId);
      const eventsQuery = query(
        collection(db, `users/${targetUserId}/events`),
        where("repeat", "==", selectedEvent.repeat)
      );
      const querySnapshot = await getDocs(eventsQuery);
      const batch = writeBatch(db); 
      querySnapshot.forEach((docSnap) => {
        let ev = docSnap.data();
        if (ev.checked === false) {
          batch.delete(docSnap.ref);
          dispatchCalEvent({ type: "delete", payload: { id: ev.id } });
        }
      });
      await batch.commit(); 
      handleClose();
    } catch (error) {
      console.error("Error deleting future events: ", error);
    }
  };

  // --- SALVATAGGIO EVENTI MODIFICATI E CREATI ---
  const handleSaveSingle = async () => {
    await performSave(false);
  };

  const handleSaveFuture = async () => {
    await performSave(true);
  };

  const performSave = async (updateFutureSerie) => {
    setLoading(true);
    if (selectedLabel === "") {
      setShowLabelWarning(true);
      setLoading(false);
      return;
    }
    setShowLabelWarning(false);
    
    const repeatId = generateRandomId();
    const targetUserId = getTargetUserId(selectedCalendar);
    const isSharedEvent = targetUserId !== auth.currentUser.uid;

    // MAGIA: Troviamo l'ID del DB (L'ID corto per i calendari condivisi)
    const calObj = calendars.find(c => c.id === selectedCalendar || c.docId === selectedCalendar);
    const idForDB = (calObj && calObj.isShared) ? calObj.originalId : selectedCalendar;

    // Evento Locale per il Frontend
    const localEvent = {
      title: title,
      description: description || "", 
      label: selectedLabel,
      calendarId: selectedCalendar, // ID lungo per la UI
      day: date.getTime(),
      postponable: postponable,
      id: selectedEvent ? selectedEvent.id : Date.now().toString(),
      checked: isChecked,
      repeat: repeatOptions ? repeatId : (selectedEvent ? selectedEvent.repeat : null),
      repeatType: repeatOptions ? getRepeatTypeString(repeatOptions) : (selectedEvent ? selectedEvent.repeatType : null),
      time: specificTime ? time : null,
      userId: auth.currentUser.uid,
      isShared: isSharedEvent 
    };

    // Evento Reale per il Database
    const dbEvent = {
      ...localEvent,
      calendarId: idForDB // Ripristiniamo l'ID corto per il DB dell'Owner!
    };

    try {
      // 1. GESTIONE EVENTO "POSTPONABLE" DUPLICATO
      if (selectedEvent && selectedEvent.postponable && selectedEvent.day !== localEvent.day) {
        const duplicatedEventLocal = { ...localEvent, id: Date.now().toString(), checked: false, postponable: true };
        const duplicatedEventDB = { ...dbEvent, id: duplicatedEventLocal.id, checked: false, postponable: true };
        
        await setDoc(doc(db, `users/${targetUserId}/events`, duplicatedEventDB.id), duplicatedEventDB);
        dispatchCalEvent({ type: "push", payload: duplicatedEventLocal });

        const updatedPostponableEventLocal = { ...selectedEvent, checked: true };
        const originalOwnerId = getTargetUserId(selectedEvent.calendarId);
        
        // Prepariamo anche questo per il DB
        const calObjOriginal = calendars.find(c => c.id === selectedEvent.calendarId || c.docId === selectedEvent.calendarId);
        const originalIdForDB = (calObjOriginal && calObjOriginal.isShared) ? calObjOriginal.originalId : selectedEvent.calendarId;
        const updatedPostponableEventDB = { ...updatedPostponableEventLocal, calendarId: originalIdForDB };

        await setDoc(doc(db, `users/${originalOwnerId}/events`, selectedEvent.id), updatedPostponableEventDB);
        dispatchCalEvent({ type: "update", payload: updatedPostponableEventLocal });
      } 
      // 2. AGGIORNAMENTO DI UNA SERIE ("Modifica Futuri")
      else if (selectedEvent && selectedEvent.repeat && updateFutureSerie) {
        const batch = writeBatch(db);
        const eventsQuery = query(
          collection(db, `users/${targetUserId}/events`),
          where("repeat", "==", selectedEvent.repeat),
          where("checked", "==", false)
        );
        const querySnapshot = await getDocs(eventsQuery);
        const updatedEventsLocal = [];
        
        querySnapshot.forEach((docSnap) => {
          const oldEvent = docSnap.data();
          const updatedEventLocal = { ...localEvent, day: oldEvent.day, id: oldEvent.id }; 
          const updatedEventDB = { ...dbEvent, day: oldEvent.day, id: oldEvent.id }; 
          
          batch.update(docSnap.ref, updatedEventDB);
          updatedEventsLocal.push(updatedEventLocal);
        });
        await batch.commit();
        updatedEventsLocal.forEach((ev) => dispatchCalEvent({ type: "update", payload: ev }));
      } 
      // 3. SALVATAGGIO SINGOLO O NUOVO EVENTO
      else {
        await setDoc(doc(db, `users/${targetUserId}/events`, localEvent.id), dbEvent);
        if (selectedEvent) {
          dispatchCalEvent({ type: "update", payload: localEvent });
        } else {
          dispatchCalEvent({ type: "push", payload: localEvent });
        }
      }

      // 4. CREA NUOVA SERIE 
      if (repeatOptions && !updateFutureSerie) {
        await createRepeatedEvents(localEvent, dbEvent, repeatOptions);
      }

      handleClose();
    } catch (error) {
      console.error("Error saving document: ", error);
      resetForm(); 
    }
    setLoading(false);
  };

  async function createRepeatedEvents(localEvent, dbEvent, repeatOpts, startDateArg = new Date(localEvent.day)) {
     const { endDate, endMonth, endYear, customRepeat, endOption, occurrences } = repeatOpts;
     const { interval, daysOfWeek, frequency, dayOfMonth } = customRepeat;
     const startMonth = dayjs(localEvent.day).month() + 1;
     const startYear = dayjs(localEvent.day).year();
     const batch = writeBatch(db); 
     const targetUserId = getTargetUserId(localEvent.calendarId); 
 
     let calculatedEndYear = endYear;
     let calculatedEndDate = endDate;
     let calculatedEndMonth = endMonth;
 
     if (endOption === "never") {
       calculatedEndYear = startYear + 20;
       calculatedEndDate = dayjs(localEvent.day).add(20, "year").toDate();
     } else if (endOption === "occurrences") {
       let freq;
       switch (frequency) {
         case "monthly": freq = "month"; break;
         case "yearly": freq = "year"; break;
         case "week": freq = "week"; break;
         case "monthlyCustom": freq = "month"; break;
         default: break;
       }
       calculatedEndDate = dayjs(localEvent.day).add(parseInt(occurrences, 10) * parseInt(interval, 10), freq).toDate();
       calculatedEndMonth = dayjs(calculatedEndDate).month();
       calculatedEndYear = dayjs(calculatedEndDate).year();
     }
 
     if (frequency === "week") {
       const weeksMatrix = getWeeksInInterval(startMonth, startYear, endMonth, calculatedEndYear, startDateArg, calculatedEndDate);
       let eventCount = 0;
       setRepeatTypeString(`Ogni ${interval} settimane, ${daysOfWeek.length} giorni`);
       for (let weekIndex = 0; weekIndex < weeksMatrix.length; weekIndex += parseInt(interval, 10)) {
         for (let i = 0; i < daysOfWeek.length; i++) {
           const dayIndex = daysOfWeek[i][0];
           const day = weeksMatrix[weekIndex][dayIndex];
           if (weekIndex >= weeksMatrix.length || dayIndex >= weeksMatrix[weekIndex].length || !day) continue;
           
           const eventDate = dayjs(day, "ddd, D MMM, YYYY").toDate();
           if (day === dayjs(localEvent.day).locale("en").format("ddd, D MMM, YYYY") || eventDate < dayjs(localEvent.day).toDate()) continue;
 
           const repeatedEventLocal = { ...localEvent, day: eventDate.getTime(), id: `${localEvent.id}-${eventCount}` };
           const repeatedEventDB = { ...dbEvent, day: eventDate.getTime(), id: `${localEvent.id}-${eventCount}` };
           
           batch.set(doc(db, `users/${targetUserId}/events`, repeatedEventDB.id), repeatedEventDB); 
           dispatchCalEvent({ type: "push", payload: repeatedEventLocal });
           eventCount++;
         }
       }
     } else if (frequency === "monthlyCustom") {
       let currentMonth = startMonth - 1;
       let currentYear = startYear;
       const originalDay = dayjs(localEvent.day).date();
       const originalMonth = dayjs(localEvent.day).month();
       const originalYear = dayjs(localEvent.day).year();
       while (currentYear < calculatedEndYear || (currentYear === calculatedEndYear && currentMonth <= calculatedEndMonth)) {
         let eventDay = dayOfMonth;
         const daysInMonth = dayjs(new Date(currentYear, currentMonth)).daysInMonth();
         if (originalDay > daysInMonth) eventDay = daysInMonth;
 
         const eventDate = dayjs(new Date(currentYear, currentMonth, eventDay)).toDate();
         if (dayjs(eventDate).isAfter(dayjs(calculatedEndDate))) break;
 
         if (eventDay === originalDay && currentMonth === originalMonth && currentYear === originalYear) {
           currentMonth += parseInt(interval, 10); 
           if (currentMonth > 11) { currentMonth -= 12; currentYear++; }
           continue;
         }
 
         const repeatedEventLocal = { ...localEvent, day: eventDate.getTime(), id: `${localEvent.id}-${currentYear}-${currentMonth}` };
         const repeatedEventDB = { ...dbEvent, day: eventDate.getTime(), id: `${localEvent.id}-${currentYear}-${currentMonth}` };
         
         batch.set(doc(db, `users/${targetUserId}/events`, repeatedEventDB.id), repeatedEventDB); 
         dispatchCalEvent({ type: "push", payload: repeatedEventLocal });
 
         currentMonth += parseInt(interval, 10); 
         if (currentMonth > 11) { currentMonth -= 12; currentYear++; }
       }
     } else if (repeatOpts.repeatType === "monthly") {
       let currentMonth = startMonth;
       let currentYear = startYear;
       const originalDay = dayjs(localEvent.day).date();
       while (currentYear < calculatedEndYear || (currentYear === calculatedEndYear && currentMonth <= calculatedEndMonth)) {
         let eventDay = originalDay;
         const daysInMonth = dayjs(new Date(currentYear, currentMonth)).daysInMonth();
         if (originalDay > daysInMonth) eventDay = daysInMonth;
 
         const eventDate = dayjs(new Date(currentYear, currentMonth, eventDay)).toDate();
         if (dayjs(eventDate).isAfter(dayjs(calculatedEndDate))) break;
 
         const repeatedEventLocal = { ...localEvent, day: eventDate.getTime(), id: `${localEvent.id}-${currentYear}-${currentMonth}` };
         const repeatedEventDB = { ...dbEvent, day: eventDate.getTime(), id: `${localEvent.id}-${currentYear}-${currentMonth}` };
         
         batch.set(doc(db, `users/${targetUserId}/events`, repeatedEventDB.id), repeatedEventDB); 
         dispatchCalEvent({ type: "push", payload: repeatedEventLocal });
 
         if (currentMonth === 11) { currentMonth = 0; currentYear++; } else { currentMonth++; }
       }
     } else if (repeatOpts.repeatType === "yearly") {
       let currentYear = startYear + 1;
       const originalDay = dayjs(localEvent.day).date();
       const originalMonth = dayjs(localEvent.day).month();
 
       while (currentYear <= calculatedEndYear) {
         const eventDate = dayjs(new Date(currentYear, originalMonth, originalDay)).toDate();
         const repeatedEventLocal = { ...localEvent, day: eventDate.getTime(), id: `${localEvent.id}-${currentYear}` };
         const repeatedEventDB = { ...dbEvent, day: eventDate.getTime(), id: `${localEvent.id}-${currentYear}` };
         
         batch.set(doc(db, `users/${targetUserId}/events`, repeatedEventDB.id), repeatedEventDB); 
         dispatchCalEvent({ type: "push", payload: repeatedEventLocal });
         currentYear++;
       }
     }
 
     await batch.commit(); 
  }

  const handleClose = () => {
    setShowEventModal(false);
    setSelectedEvent(null); 
    resetForm(); 
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        options.push(<option key={timeString} value={timeString}>{timeString}</option>);
      }
    }
    return options;
  };

  const closeDuplicateModal = () => {
    setShowDuplicateModal(false);
    setDuplicateData(null);
    setDuplicateSpecificTime(false);
    setDuplicateLoading(false);
    setDuplicateRepeatOptions(null);
    setShowDuplicateRepeatModal(false);
  };

  const openDuplicateModal = () => {
    if (!selectedEvent) return;
    const duplicate = {
      title: selectedEvent.title || "",
      description: selectedEvent.description || "",
      label: selectedEvent.label || "",
      calendarId: selectedEvent.calendarId || "",
      date: new Date(selectedEvent.day),
      time: selectedEvent.time || time,
    };
    setDuplicateData(duplicate);
    setDuplicateSpecificTime(!!selectedEvent.time);
    setDuplicateRepeatOptions(null);
    setShowDuplicateModal(true);
  };

  const handleDuplicateChange = (key, value) => {
    setDuplicateData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDuplicateSave = async () => {
    if (!duplicateData) return;
    if (!duplicateData.label || !duplicateData.calendarId) {
      alert("Seleziona calendario e categoria per duplicare.");
      return;
    }
    setDuplicateLoading(true);
    const repeatId = duplicateRepeatOptions ? generateRandomId() : null;
    const targetUserId = getTargetUserId(duplicateData.calendarId);
    
    const calObj = calendars.find(c => c.id === duplicateData.calendarId || c.docId === duplicateData.calendarId);
    const idForDB = (calObj && calObj.isShared) ? calObj.originalId : duplicateData.calendarId;

    const newEventLocal = {
      ...selectedEvent,
      title: duplicateData.title,
      description: duplicateData.description || "",
      label: duplicateData.label,
      calendarId: duplicateData.calendarId, 
      day: duplicateData.date.getTime(),
      postponable: selectedEvent ? selectedEvent.postponable : false,
      id: `${Date.now().toString()}-${generateRandomId()}`,
      checked: false,
      repeat: repeatId,
      repeatType: duplicateRepeatOptions ? getRepeatTypeString(duplicateRepeatOptions) : null,
      time: duplicateSpecificTime ? duplicateData.time : null,
      userId: auth.currentUser.uid,
      isShared: targetUserId !== auth.currentUser.uid
    };

    const newEventDB = {
      ...newEventLocal,
      calendarId: idForDB 
    };

    try {
      await setDoc(doc(db, `users/${targetUserId}/events`, newEventDB.id), newEventDB);
      dispatchCalEvent({ type: "push", payload: newEventLocal });
      
      if (duplicateRepeatOptions) {
        await createRepeatedEvents(newEventLocal, newEventDB, duplicateRepeatOptions, duplicateData.date);
      }
      closeDuplicateModal();
    } catch (error) {
      console.error("Error duplicating event: ", error);
    }
    setDuplicateLoading(false);
  };

  const handleRepeatModalClose = () => {
    setShowRepeatModal(false);
    setRepeatOptions(null); 
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
      {showDuplicateRepeatModal && duplicateData && (
        <RepeatEventModal
          onClose={() => setShowDuplicateRepeatModal(false)}
          onSave={(options) => {
            setDuplicateRepeatOptions(options);
            setShowDuplicateRepeatModal(false);
          }}
          selectedDate={duplicateData.date}
          repeatType={
            duplicateRepeatOptions
              ? duplicateRepeatOptions.repeatType
              : "no_repeat"
          }
          setShowRepeatModal={setShowDuplicateRepeatModal}
        />
      )}
      
      {showDuplicateModal && duplicateData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-55">
          <div className="bg-white dark:bg-zinc-950 rounded-4xl w-[24rem] shadow-2xl md:w-4/5">
            <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center rounded-t-4xl">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200 ml-1 mt-1">
                content_copy
              </span>
              <div>
                <button
                  type="button"
                  onClick={closeDuplicateModal}
                  className="material-icons-outlined text-gray-400 dark:text-zinc-200 mr-2"
                >
                  close
                </button>
              </div>
            </header>
            <div className="p-3 mt-2 ml-10">
              <div className="flex flex-col gap-y-4">
                <div className="flex flex-row items-center mb-6 mt-2 md:mt-0">
                  <p className="text-black dark:text-white ml-6 md:ml-16 w-24">
                    Scegli un calendario:
                  </p>
                  <div className="grid grid-cols-4 gap-x-4 gap-y-3 items-center ml-6 hidden md:!grid">
                    {sortedCalendar.map((cal, i) => (
                      <div
                        key={i}
                        onClick={() =>
                          handleDuplicateChange("calendarId", cal.id)
                        }
                        className={`flex items-center justify-center cursor-pointer rounded w-36 h-8 border ${
                          duplicateData.calendarId === cal.id
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
                  <div className="md:hidden ml-6">
                    <select
                      value={duplicateData.calendarId}
                      onChange={(e) =>
                        handleDuplicateChange("calendarId", e.target.value)
                      }
                      className="border rounded-2xl p-2 dark:bg-zinc-700 dark:text-white px-4"
                    >
                      <option value="">Scegli</option>
                      {sortedCalendar.map((cal, i) => (
                        <option key={i} value={cal.id}>
                          {cal.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-row">
                  {labels.filter(
                    (label) => label.calendarId === duplicateData.calendarId
                  ).length > 0 && (
                    <p className="text-black dark:text-white ml-6 md:ml-16 w-24">
                      Scegli una categoria:
                    </p>
                  )}
                  <div className="grid grid-cols-6 gap-x-6 gap-y-4 ml-6 hidden md:!grid">
                    {labels
                      .filter(
                        (label) => label.calendarId === duplicateData.calendarId
                      )
                      .sort((a, b) => a.code - b.code)
                      .map((lbl, i) => (
                        <div
                          key={i}
                          onClick={() =>
                            handleDuplicateChange("label", lbl.name)
                          }
                          className="flex items-center justify-center cursor-pointer rounded w-36 h-8"
                          style={{
                            backgroundColor:
                              duplicateData.label === lbl.name
                                ? `${lbl.color}80`
                                : lbl.color,
                            border:
                              duplicateData.label === lbl.name
                                ? "2px solid white"
                                : "2px solid transparent",
                          }}
                        >
                          <span className="text-black font-bold text-sm">
                            {lbl.name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="md:hidden flex flex-row items-center ml-6">
                  {labels.filter(
                    (label) => label.calendarId === duplicateData.calendarId
                  ).length > 0 && (
                    <p className="text-black dark:text-white w-24 mr-4">
                      Scegli una categoria:
                    </p>
                  )}
                  <select
                    value={duplicateData.label}
                    onChange={(e) =>
                      handleDuplicateChange("label", e.target.value)
                    }
                    className="border rounded-2xl p-2 px-10 dark:bg-zinc-700 dark:text-white"
                  >
                    <option value="">Scegli</option>
                    {labels
                      .filter(
                        (label) => label.calendarId === duplicateData.calendarId
                      )
                      .sort((a, b) => a.code - b.code)
                      .map((lbl, i) => (
                        <option key={i} value={lbl.name}>
                          {lbl.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col md:flex-row md:items-center w-full mt-6">
                  <div className="flex flex-row items-center md:ml-6">
                    <span className="material-icons-outlined text-gray-400 dark:text-zinc-200 ml-2 md:ml-0">
                      edit
                    </span>
                    <div className="flex flex-col items-center ml-6">
                      <div className="flex flex-col md:flex-row items-start">
                        <input
                          type="text"
                          name="duplicate_title"
                          placeholder={t("add_title")}
                          value={duplicateData.title}
                          required
                          className="md:mr-[9rem] pt-3 border-0 text-gray-600 dark:text-zinc-200 w-64 text-xl font-semibold pb-2 md:w-60 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                          onChange={(e) =>
                            handleDuplicateChange("title", e.target.value)
                          }
                        />
                      </div>
                      <textarea
                        name="duplicate_description"
                        placeholder={t("add_description")}
                        value={duplicateData.description}
                        rows="4"
                        className="mt-4 md:mt-0 pt-3 text-gray-600 dark:text-zinc-200 pb-2 w-64 md:w-96 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 bg-gray-100 dark:bg-zinc-700 rounded"
                        onChange={(e) =>
                          handleDuplicateChange("description", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex md:items-center flex-col md:flex-row md:ml-24 mt-6 md:mt-0">
                    <div className="flex flex-row">
                      <div className="flex items-center">
                        <span className="material-icons text-gray-400 dark:text-zinc-200 ml-2 md:ml-0">
                          event
                        </span>
                      </div>
                      <div className="flex items-center gap-x-2 ml-6 md:ml-4 justify-between">
                        <div>
                          <DatePicker
                            selected={duplicateData.date}
                            onChange={(date) =>
                              handleDuplicateChange("date", date)
                            }
                            dateFormat="dd/MM/yyyy"
                            className="w-38 md:w-32 p-2 md:ml-4 border rounded-2xl border-black dark:border-zinc-600 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                            locale={it}
                          />
                          <div className="flex md:justify-end mt-4">
                            <select
                              value={
                                duplicateRepeatOptions
                                  ? duplicateRepeatOptions.repeatType
                                  : "no_repeat"
                              }
                              onChange={(e) => {
                                if (e.target.value !== "no_repeat") {
                                  setShowDuplicateRepeatModal(true);
                                  setDuplicateRepeatOptions({
                                    repeatType: e.target.value,
                                  });
                                } else {
                                  setDuplicateRepeatOptions(null);
                                }
                              }}
                              className="w-38 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-800 px-8 rounded-2xl text-white mr-2"
                            >
                              <option value="no_repeat">
                                {t("no_repeat")}
                              </option>
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

                      <div className="flex items-center gap-x-2 ml-6 md:ml-2">
                        <select
                          value={duplicateData.time}
                          onChange={(e) =>
                            handleDuplicateChange("time", e.target.value)
                          }
                          className={`custom-scrollbar w-36 md:w-32 p-2 border rounded-2xl ${
                            duplicateSpecificTime
                              ? "border-black dark:border-zinc-200"
                              : "border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-700"
                          }`}
                          disabled={!duplicateSpecificTime}
                        >
                          {generateTimeOptions()}
                        </select>
                      </div>
                      <input
                        type="checkbox"
                        checked={duplicateSpecificTime}
                        onChange={() =>
                          setDuplicateSpecificTime(!duplicateSpecificTime)
                        }
                        className="ml-4 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <footer className="flex justify-end p-3 mt-3 rounded-b-4xl">
              <button
                type="button"
                onClick={closeDuplicateModal}
                className="px-4 py-2 rounded-2xl border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-white"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleDuplicateSave}
                className="ml-3 px-5 py-2 rounded-4xl bg-blue-600 hover:bg-blue-700 text-white"
                disabled={duplicateLoading}
              >
                {duplicateLoading ? "Salva..." : "Crea duplicato"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* FORM PRINCIPALE MODIFICA / CREA EVENTO */}
      <form
        className="bg-white dark:bg-zinc-950 rounded-4xl w-[24rem] shadow-2xl md:w-4/5 z-51"
        onSubmit={(e) => e.preventDefault()} 
      >
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center rounded-t-4xl">
          <span className="material-icons-outlined text-gray-400 dark:text-zinc-200 ml-4">
            drag_handle
          </span>
          <div className="flex items-center">
            {selectedEvent && (
              <span
                onClick={openDuplicateModal}
                className="material-icons-outlined font-bold text-gray-500 hover:text-blue-500 dark:text-zinc-300 cursor-pointer mr-4 transition-colors"
                title="Duplica"
              >
                content_copy
              </span>
            )}
            {selectedEvent && !selectedEvent.repeat && (
              <span
                onClick={handleDeleteSingle}
                className="material-icons-outlined font-bold text-red-500 hover:text-red-700 cursor-pointer mr-6 transition-colors"
              >
                delete
              </span>
            )}
            {selectedEvent && selectedEvent.repeat && (
               <div className="flex items-center border-l border-gray-300 dark:border-zinc-700 pl-4 mr-4">
                 <span
                  onClick={handleDeleteSingle}
                  className="text-sm font-bold text-red-400 hover:text-red-600 cursor-pointer mr-3 transition-colors"
                  title="Elimina solo questo"
                >
                  ELIMINA SINGOLO
                </span>
                <span
                  onClick={handleDeleteFuture}
                  className="text-sm font-bold text-red-600 hover:text-red-800 cursor-pointer transition-colors"
                  title="Elimina questo e futuri"
                >
                  ELIMINA SERIE
                </span>
               </div>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="material-icons-outlined text-gray-400 dark:text-zinc-200 ml-4 mr-2"
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
                {/* USA L'ARRAY FILTRATO sortedCalendar */}
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
                  {/* USA L'ARRAY FILTRATO sortedCalendar */}
                  {sortedCalendar.map((cal, i) => (
                    <option key={i} value={cal.id}>
                      {cal.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-row">
              {labels.filter((label) => label.calendarId === selectedCalendar).length > 0 && (
                <p className="text-black dark:text-white ml-16 md:ml-28 w-20">
                  Scegli una categoria:
                </p>
              )}
              <div className="grid grid-cols-6 gap-x-10 gap-y-5 ml-16 hidden md:!grid">
                {labels
                  .filter((label) => label.calendarId === selectedCalendar)
                  .sort((a, b) => a.code - b.code)
                  .map((lbl, i) => (
                    <div
                      key={i}
                      onClick={() => (!isChecked || !postponable) && setSelectedLabel(lbl.name)}
                      className="flex items-center justify-center cursor-pointer rounded w-40 h-8"
                      style={{
                        backgroundColor: selectedLabel === lbl.name ? `${lbl.color}80` : lbl.color,
                        border: selectedLabel === lbl.name ? `2px solid white` : "2px solid transparent",
                      }}
                    >
                      <span className="text-black font-bold text-sm">{lbl.name}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center w-screen mt-10">
              <div className="flex flex-row items-center md:ml-10">
                <span className="material-icons-outlined text-gray-400 dark:text-zinc-200 ml-2 md:ml-3 -mt-16 md:mt-0">
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
                          value={repeatOptions ? repeatOptions.repeatType : "no_repeat"}
                          disabled={isChecked && postponable}
                          onChange={(e) => {
                            if (e.target.value !== "no_repeat") {
                              setShowRepeatModal(true);
                              setRepeatOptions({ repeatType: e.target.value });
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
                        specificTime ? "border-black dark:border-zinc-200" : "border-gray-300 bg-gray-100 dark:border-zinc-700 dark:bg-zinc-700"
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
          </div>
        </div>

        <footer className="flex justify-end items-center p-4 mt-5 rounded-b-4xl border-t border-gray-200 dark:border-zinc-800">
          {showLabelWarning && <p className="text-red-500 mr-6">{t("select_a_label")}</p>}
          {loading && <p className="text-blue-500 mr-6">Salvataggio...</p>}

          {/* PULSANTI DI SALVATAGGIO */}
          {selectedEvent && selectedEvent.repeat ? (
            <div className="flex gap-2 mr-4">
              <button
                type="button"
                onClick={handleSaveSingle}
                className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-4xl text-white transition-colors"
                disabled={isChecked && postponable}
              >
                Salva Singolo
              </button>
              <button
                type="button"
                onClick={handleSaveFuture}
                className="bg-blue-700 hover:bg-blue-800 px-6 py-2 rounded-4xl text-white transition-colors"
                disabled={isChecked && postponable}
              >
                Salva Serie
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSaveSingle}
              className="bg-blue-500 hover:bg-blue-600 px-8 py-2 rounded-4xl text-white transition-colors mr-4"
              disabled={isChecked && postponable}
            >
              {t("save")}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}