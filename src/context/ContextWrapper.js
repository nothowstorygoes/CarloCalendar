import React, { useState, useEffect, useReducer } from "react";
import GlobalContext from "./GlobalContext";
import dayjs from "dayjs";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

function savedEventsReducer(state, { type, payload }) {
  switch (type) {
    case "set":
      console.log("Reducer set action payload:", payload);
      return payload;
    case "push":
      return [...state, payload];
    case "update":
      return state.map((evt) => (evt.id === payload.id ? payload : evt));
    case "delete":
      return state.filter((evt) => evt.id !== payload.id);
    default:
      throw new Error(`Unhandled action type: ${type}`);
  }
}

function initEvents() {
  return [];
}

export default function ContextWrapper(props) {
  const [monthIndex, setMonthIndex] = useState(dayjs().month());
  const [year, setYear] = useState(dayjs().year());
  const [daySelected, setDaySelected] = useState(dayjs());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [labels, setLabels] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [viewMode, setViewMode] = useState("day");
  const [labelManager, toggleLabelManager] = useState(false);
  const [showLabelEventsModal, setShowLabelEventsModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [smallCalendarMonth, setSmallCalendarMonth] = useState(dayjs().month());
  const [user, setUser] = useState(null); 
  const [selectedCalendar,setSelectedCalendar] = useState([]);
  const [calendarsVisibility, setCalendarsVisibility] = useState({}); 
  const [calendars, setCalendars] = useState([]); 

  const [savedEvents, dispatchCalEvent] = useReducer(
    savedEventsReducer,
    [],
    initEvents
  );

  // Filtro base (Label)
  useEffect(() => {
    const labelNames = labels.map((lbl) => lbl.name);
    const filtered = savedEvents.filter((evt) => {
      return labelNames.includes(evt.label);
    });
    setFilteredEvents(filtered);
  }, [labels, savedEvents]);

  // Filtro Calendari (Quello che faceva mischiare tutto!)
  useEffect(() => {
    const visibleCalendars = Object.keys(calendarsVisibility)
      .filter((calendarId) => calendarsVisibility[calendarId]);
  
    // Ora i calendari condivisi avranno l'ID lungo, quindi non si sovrapporranno!
    const filtered = savedEvents.filter((evt) => visibleCalendars.includes(evt.calendarId.toString()));
    
    setFilteredEvents(filtered);
  }, [savedEvents, calendarsVisibility]);


  useEffect(() => {
    const fetchCalendars = async () => {
      if (user) {
        try {
          const calendarsCollectionRef = collection(db, `users/${user.uid}/calendars`);
          const calendarsSnapshot = await getDocs(calendarsCollectionRef);
          const personalCalendars = calendarsSnapshot.docs.map((doc) => ({
            uniqueId: doc.id,
            id: doc.data().id, // Questo è l'"1" personale
            docId: doc.id,
            isShared: false,
            ...doc.data(),
          }));

          const sharedPointersRef = collection(db, `users/${user.uid}/shared_calendars`);
          const sharedPointersSnap = await getDocs(sharedPointersRef);
          
          const sharedCalendars = [];

          for (const pointer of sharedPointersSnap.docs) {
            const { ownerId, calendarId, role } = pointer.data();
            
            const realCalendarRef = doc(db, `users/${ownerId}/calendars/${calendarId}`);
            const realCalendarSnap = await getDoc(realCalendarRef);

            if (realCalendarSnap.exists()) {
              const realCalendarData = realCalendarSnap.data();
              // QUI LA MAGIA: leggiamo il ruolo freschissimo dal dizionario 'sharedWith' dell'Owner
              const actualRole = realCalendarData.sharedWith && realCalendarData.sharedWith[user.uid] 
                                  ? realCalendarData.sharedWith[user.uid] 
                                  : role;

              sharedCalendars.push({
                ...realCalendarData,
                id: realCalendarSnap.id,  
                originalId: realCalendarData.id,
                uniqueId: realCalendarSnap.id,
                docId: realCalendarSnap.id,
                isShared: true,
                role: actualRole, // <-- Sostituisci "role: role" con questo!
                ownerId: ownerId
              });
            }
          }

          const allCalendars = [...personalCalendars, ...sharedCalendars];
          
          const initialVisibility = {};
          allCalendars.forEach((calendar) => {
            // Ora l'oggetto sarà: { "1": true, "Kq0...": true }
            initialVisibility[calendar.id] = true;
          });
          
          setCalendarsVisibility(initialVisibility);
          setCalendars(allCalendars);

        } catch (error) {
          console.error("ERRORE FIREBASE BLOCCANTE: ", error);
        }
      }
    };

    fetchCalendars();
  }, [user]);

  const createLabel = async (newLabel) => {
    try {
      const labelRef = await addDoc(
        collection(db, `users/${auth.currentUser.uid}/labels`),
        newLabel
      );
      setLabels([...labels, { id: labelRef.id, ...newLabel }]);
    } catch (error) {
      console.error("Error creating label: ", error);
    }
  };

  const updateLabel = async (updatedLabel) => {
    try {
      const labelRef = doc(
        db,
        `users/${auth.currentUser.uid}/labels`,
        updatedLabel.id
      );
      await updateDoc(labelRef, updatedLabel);
      setLabels(
        labels.map((lbl) => (lbl.id === updatedLabel.id ? updatedLabel : lbl))
      );
    } catch (error) {
      console.error("Error updating label: ", error);
    }
  };

  const deleteLabel = async (labelId) => {
    try {
      const labelRef = doc(db, `users/${auth.currentUser.uid}/labels`, labelId);
      await deleteDoc(labelRef);
      setLabels(labels.filter((lbl) => lbl.id !== labelId));
    } catch (error) {
      console.error("Error deleting label: ", error);
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        monthIndex,
        setMonthIndex,
        year,
        setYear,
        daySelected,
        savedEvents,
        setDaySelected,
        showEventModal,
        setShowEventModal,
        dispatchCalEvent,
        selectedEvent,
        setSelectedEvent,
        labels,
        setLabels,
        createLabel,
        updateLabel,
        deleteLabel,
        filteredEvents,
        setFilteredEvents,
        viewMode,
        setViewMode,
        labelManager,
        toggleLabelManager,
        showLabelEventsModal,
        setShowLabelEventsModal,
        selectedLabel,
        setSelectedLabel,
        smallCalendarMonth,
        setSmallCalendarMonth,
        user,
        setUser,
        calendarsVisibility, 
        setCalendarsVisibility,
        calendars,
        setCalendars,
        selectedCalendar,
        setSelectedCalendar,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
}