import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import CalendarHeader from "./components/CalendarHeader";
import Sidebar from "./components/Sidebar";
import Month from "./components/Month";
import DayInfoModal from "./components/DayView";
import WeeklyView from "./components/WeeklyView";
import WorkWeekView from "./components/WorkWeekView"; // Import WorkWeekView
import EventModal from "./components/EventModal";
import LabelManager from "./components/LabelManager";
import LabelEventsView from "./components/LabelEventsView";
import GlobalContext from "./context/GlobalContext";
import YearView from "./components/YearView";
import { getMonth } from "./util";
import dayjs from "dayjs";
import { auth, db } from "./firebase"; // Ensure you have configured Firebase
import Login from "./components/login"; // Import the Login component
import Spinner from "./assets/spinner"; // Import the Spinner component

function App() {
  const [currentMonth, setCurrentMonth] = useState(getMonth());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    monthIndex,
    showEventModal,
    viewMode,
    showLabelEventsModal,
    selectedLabel,
    setShowLabelEventsModal,
    filteredEvents,
    dispatchCalEvent,
    setFilteredEvents,
    setLabels,
  } = useContext(GlobalContext);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        console.log("User authenticated:", user);

        try {
          const eventsRef = collection(db, `users/${user.uid}/events`);
          const eventsSnapshot = await getDocs(eventsRef);
          const events = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("Fetched events:", events);
          dispatchCalEvent({ type: "set", payload: events });

          const labelsRef = collection(db, `users/${user.uid}/labels`);
          const labelsSnapshot = await getDocs(labelsRef);
          const labels = labelsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("Fetched labels:", labels);
          setLabels(labels);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      } else {
        setUser(null);
        setFilteredEvents([]);
        setLabels([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setFilteredEvents, setLabels, dispatchCalEvent]);

  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex));
  }, [monthIndex]);

  useEffect(() => {
    const currentDate = dayjs();
    filteredEvents.forEach((evt) => {
      if (evt.time && dayjs(evt.day).isBefore(currentDate, "day") && !evt.checked) {
        const updatedEvent = { ...evt, checked: true };
        dispatchCalEvent({ type: "update", payload: updatedEvent });
        const eventRef = doc(db, `users/${user.uid}/events`, evt.id);
        updateDoc(eventRef, updatedEvent);
      }
      if (!evt.time && dayjs(evt.day).isBefore(currentDate, "day") && !evt.checked) {
        const updatedEvent = { ...evt, day: currentDate.valueOf() };
        dispatchCalEvent({ type: "update", payload: updatedEvent });
        const eventRef = doc(db, `users/${user.uid}/events`, evt.id);
        updateDoc(eventRef, updatedEvent);
      }
    });
  }, [filteredEvents, dispatchCalEvent, user]);


  if (loading) {
    return <Spinner />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/Login" element={<Login />} />
        <Route
          path="/"
          element={
            user ? (
              <React.Fragment>
                {showEventModal && <EventModal />}
                <div className="h-screen flex flex-col bg-white dark:bg-zinc-900 overflow-hidden">
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
                    {viewMode === "workweek" && (
                      <div className="w-[calc(100%-16rem)] h-full">
                        <WorkWeekView />
                      </div>
                    )}
                    {viewMode === "year" && (
                      <div className="w-[calc(100%-16rem)] h-full">
                        <YearView />
                      </div>
                    )}
                    {viewMode === "label" && selectedLabel && (
                      <div className="w-[calc(100%-16rem)] h-full">
                        <LabelEventsView
                          label={selectedLabel}
                          setShowLabelEventsModal={setShowLabelEventsModal}
                        />
                      </div>
                    )}
                    {viewMode === "labelManager" && (
                      <div className="w-[calc(100%-16rem)] h-full">
                        <LabelManager />
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ) : (
              <Navigate to="/Login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;