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
  setSelectedEvent: () => {},
  labelManager: false,
  toggleLabelManager: () => {},
  setLabels: () => {},
  labels: [],
  updateLabel: () => {},
  deleteLabel: () => {},
  createLabel: () => {},
  filteredEvents: [],
  setFilteredEvents: () => {},
  viewMode: "day",
  user: null,
  setUser: () => {},
  setViewMode: () => {},
  showLabelEventsModal: false,
  setShowLabelEventsModal: () => {},
  selectedLabel: null,
  setSelectedLabel: () => {},
  selectedCalendar: null,
  setSelectedCalendar: () => {},
  calendars: [],
  setCalendars: () => {},
  calendarsVisibility: {}, // Add calendarsVisibility state
  setCalendarsVisibility: () => {}, // Add setCalendarsVisibility function
});

export default GlobalContext;