import React from "react";
import dayjs from "dayjs";

const GlobalContext = React.createContext({
  monthIndex: 0,
  setMonthIndex: (index) => {},
  smallCalendarMonth: 0,
  setSmallCalendarMonth: (index) => {},
  year: dayjs().year(),
  setYear: () => {},
  daySelected: null,
  setDaySelected: (day) => {},
  showEventModal: false,
  setShowEventModal: () => {},
  dispatchCalEvent: ({ type, payload }) => {},
  savedEvents: [],
  selectedEvent: null,
  labelManager: false,
  toggleLabelManager: () => {},
  setSelectedEvent: () => {},
  setLabels: () => {},
  labels: [],
  updateLabel: () => {},
  deleteLabel: () => {},
  createLabel: () => {},
  filteredEvents: [],
  viewMode: "month",
  setViewMode: () => {},
  showLabelEventsModal: false,
  setShowLabelEventsModal: () => {},
  selectedLabel: null,
  setSelectedLabel: () => {},
});

export default GlobalContext;