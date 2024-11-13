import React, { useContext, useEffect, useState } from "react";
import CalendarHeader from "./components/CalendarHeader";
import Sidebar from "./components/Sidebar";
import Month from "./components/Month";
import DayInfoModal from "./components/DayView";
import WeeklyView from "./components/WeeklyView";
import EventModal from "./components/EventModal";
import LabelManager from "./components/LabelManager";
import LabelEventsModal from "./components/LabelEventsView";
import GlobalContext from "./context/GlobalContext";
import { getMonth } from "./util";
import dayjs from "dayjs";

function App() {
  const [currentMonth, setCurrentMonth] = useState(getMonth());
  const { monthIndex, showEventModal, viewMode, labelManager, showLabelEventsModal, selectedLabel, setShowLabelEventsModal, filteredEvents, dispatchCalEvent } = useContext(GlobalContext);

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex));
  }, [monthIndex]);

  useEffect(() => {
    const currentDate = dayjs();
    filteredEvents.forEach((evt) => {
      if (!evt.time && dayjs(evt.day).isBefore(currentDate, 'day') && !evt.checked) {
        const updatedEvent = { ...evt, checked: true };
        dispatchCalEvent({ type: "update", payload: updatedEvent });
        localStorage.setItem(
          "savedEvents",
          JSON.stringify(
            filteredEvents.map((e) => (e.id === evt.id ? updatedEvent : e))
          )
        );
      }
    });
  }, [filteredEvents, dispatchCalEvent]);

  useEffect(() => {
    const currentDate = dayjs();
    filteredEvents.forEach((evt) => {
      if (evt.time && !evt.checked && dayjs(evt.day).endOf('day').isBefore(currentDate)) {
        const updatedEvent = { ...evt, day: currentDate.valueOf() };
        dispatchCalEvent({ type: "update", payload: updatedEvent });
        localStorage.setItem(
          "savedEvents",
          JSON.stringify(
            filteredEvents.map((e) => (e.id === evt.id ? updatedEvent : e))
          )
        );
      }
    });
  }, [filteredEvents, dispatchCalEvent]);

  return (
    <React.Fragment>
      {showEventModal && <EventModal />}
      {labelManager && <LabelManager />}
      {showLabelEventsModal && selectedLabel && (
        <LabelEventsModal label={selectedLabel} setShowLabelEventsModal={setShowLabelEventsModal} />
      )}

      <div className="h-screen flex flex-col">
        <CalendarHeader />
        <div className="flex flex-1">
          <Sidebar />
          {viewMode === "month" && <Month month={currentMonth} />}
          {viewMode === "day" && (
            <div className="w-[calc(100%-16rem)] h-full">
              <DayInfoModal />
            </div>
          )}
          {viewMode === "week" && (
            <div className="w-[calc(100%-16rem)] h-full">
              <WeeklyView />
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

export default App;