import React, { useState, useEffect, useReducer } from "react";
import GlobalContext from "./GlobalContext";
import dayjs from "dayjs";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
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
  const [viewMode, setViewMode] = useState("month");
  const [labelManager, toggleLabelManager] = useState(false);
  const [showLabelEventsModal, setShowLabelEventsModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [smallCalendarMonth, setSmallCalendarMonth] = useState(dayjs().month());

  const [savedEvents, dispatchCalEvent] = useReducer(savedEventsReducer, [], initEvents);

  useEffect(() => {
    console.log("Saved events updated:", savedEvents);
    const labelNames = labels.map((lbl) => lbl.name);
    console.log("Label names:", labelNames);
    const filtered = savedEvents.filter((evt) => labelNames.includes(evt.label));
    console.log("Filtered events:", filtered);
    setFilteredEvents(filtered);
  }, [savedEvents, labels]);

  useEffect(() => {
    console.log("Filtered events updated:", filteredEvents);
  }, [filteredEvents]);

  const createLabel = async (newLabel) => {
    try {
      const labelRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/labels`), newLabel);
      setLabels([...labels, { id: labelRef.id, ...newLabel }]);
    } catch (error) {
      console.error("Error creating label: ", error);
    }
  };

  const updateLabel = async (updatedLabel) => {
    try {
      const labelRef = doc(db, `users/${auth.currentUser.uid}/labels`, updatedLabel.id);
      await updateDoc(labelRef, updatedLabel);
      setLabels(labels.map((lbl) => (lbl.id === updatedLabel.id ? updatedLabel : lbl)));
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
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
}