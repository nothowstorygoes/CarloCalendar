import React, { useState, useEffect, useReducer, useMemo } from "react";
import GlobalContext from "./GlobalContext";
import dayjs from "dayjs";

function savedEventsReducer(state, { type, payload }) {
  switch (type) {
    case "push":
      return [...state, payload];
    case "update":
      return state.map((evt) => (evt.id === payload.id ? payload : evt));
    case "delete":
      return state.filter((evt) => evt.id !== payload.id);
    default:
      throw new Error();
  }
}

function initEvents() {
  const storageEvents = localStorage.getItem("savedEvents");
  const parsedEvents = storageEvents ? JSON.parse(storageEvents) : [];
  return parsedEvents;
}

export default function ContextWrapper(props) {
  const [monthIndex, setMonthIndex] = useState(dayjs().month());
  const [year, setYear] = useState(dayjs().year());
  const [smallCalendarMonth, setSmallCalendarMonth] = useState(null);
  const [daySelected, setDaySelected] = useState(dayjs());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [labelManager, toggleLabelManager] = useState(false);
  const [labels, setLabels] = useState([]); // Initialize as an empty array
  const [viewMode, setViewMode] = useState("month");
  const [showLabelEventsModal, setShowLabelEventsModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [savedEvents, dispatchCalEvent] = useReducer(
    savedEventsReducer,
    [],
    initEvents
  );

  const filteredEvents = useMemo(() => {
    return savedEvents.filter((evt) =>
      labels
        .filter((lbl) => lbl.checked)
        .map((lbl) => lbl.name)
        .includes(evt.label)
    );
  }, [savedEvents, labels]);

  useEffect(() => {
    localStorage.setItem("savedEvents", JSON.stringify(savedEvents));
  }, [savedEvents]);

  useEffect(() => {
    const storageLabels = localStorage.getItem("labels");
    if (storageLabels) {
      setLabels(JSON.parse(storageLabels));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("labels", JSON.stringify(labels));
  }, [labels]);

  useEffect(() => {
    setLabels((prevLabels) => {
      return [...new Set(savedEvents.map((evt) => evt.label))].map((label) => {
        const currentLabel = prevLabels.find((lbl) => lbl.name === label);
        return {
          name: label,
          color: currentLabel ? currentLabel.color : "gray",
          checked: currentLabel ? currentLabel.checked : true,
        };
      });
    });
  }, [savedEvents]);

  useEffect(() => {
    if (smallCalendarMonth !== null) {
      setMonthIndex(smallCalendarMonth);
    }
  }, [smallCalendarMonth]);

  useEffect(() => {
    if (!showEventModal) {
      setSelectedEvent(null);
    }
  }, [showEventModal]);

  function updateLabel(updatedLabel) {
    setLabels(labels.map((lbl) => (lbl.name === updatedLabel.name ? updatedLabel : lbl)));
  }

  function deleteLabel(labelName) {
    setLabels(labels.filter((lbl) => lbl.name !== labelName));
  }

  function createLabel(newLabel) {
    setLabels([...labels, newLabel]);
  }

  return (
    <GlobalContext.Provider
      value={{
        monthIndex,
        setMonthIndex,
        year,
        setYear,
        smallCalendarMonth,
        setSmallCalendarMonth,
        daySelected,
        setDaySelected,
        showEventModal,
        setShowEventModal,
        dispatchCalEvent,
        selectedEvent,
        setSelectedEvent,
        savedEvents,
        setLabels,
        labels,
        updateLabel,
        deleteLabel,
        createLabel,
        filteredEvents,
        viewMode,
        setViewMode,
        labelManager,
        toggleLabelManager,
        showLabelEventsModal,
        setShowLabelEventsModal,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
}