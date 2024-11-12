import React, { useContext, useEffect, useState } from "react";
import CalendarHeader from "./components/CalendarHeader";
import Sidebar from "./components/Sidebar";
import Month from "./components/Month";
import DayInfoModal from "./components/DayView";
import WeeklyView from "./components/WeeklyView";
import EventModal from "./components/EventModal";
import LabelManager from "./components/LabelManager";
import GlobalContext from "./context/GlobalContext";
import { getMonth } from "./util";

function App() {
  const [currentMonth, setCurrentMonth] = useState(getMonth());
  const { monthIndex, showEventModal, viewMode, labelManager } = useContext(GlobalContext);

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex));
  }, [monthIndex]);

  return (
    <React.Fragment>
      {showEventModal && <EventModal />}
      {labelManager && <LabelManager />}

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