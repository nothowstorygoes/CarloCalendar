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
import Backup from "./components/Backup";
import Profile from "./components/Profile";
import { auth, db } from "./firebase"; // Ensure you have configured Firebase
import Login from "./components/login"; // Import the Login component
import Spinner from "./assets/spinner"; // Import the Spinner component
import CalendarSettings from "./components/calendarSettings";

function App() {
  const [currentMonth, setCurrentMonth] = useState(getMonth());
  const [loading, setLoading] = useState(true);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);

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
    user,
    setUser,
    setViewMode,
    setShowEventModal
  } = useContext(GlobalContext);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        console.log("User authenticated:", user);

        try {
          const eventsRef = collection(db, `users/${user.uid}/events`);
          const labelsRef = collection(db, `users/${user.uid}/labels`);

          // Fetch both collections in parallel
          const [eventsSnapshot, labelsSnapshot] = await Promise.all([
            getDocs(eventsRef),
            getDocs(labelsRef),
          ]);

          // Process events
          const events = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("Fetched events:", events);
          dispatchCalEvent({ type: "set", payload: events });

          // Process labels
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
      if (
        evt.time &&
        dayjs(evt.day).isBefore(currentDate, "day") &&
        !evt.checked
      ) {
        const updatedEvent = { ...evt, checked: true };
        dispatchCalEvent({ type: "update", payload: updatedEvent });
        const eventRef = doc(db, `users/${user.uid}/events`, evt.id);
        updateDoc(eventRef, updatedEvent);
      }
      if (
        !evt.time &&
        dayjs(evt.day).isBefore(currentDate, "day") &&
        !evt.checked
      ) {
        const updatedEvent = { ...evt, day: currentDate.valueOf() };
        dispatchCalEvent({ type: "update", payload: updatedEvent });
        const eventRef = doc(db, `users/${user.uid}/events`, evt.id);
        updateDoc(eventRef, updatedEvent);
      }
    });
  }, [filteredEvents, dispatchCalEvent, user]);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center bg-zinc-900">
        <Spinner />
      </div>
    );
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
                <div className="h-screen flex flex-col bg-zinc-800 md:bg-white dark:bg-zinc-900 overflow-hidden">
                  <CalendarHeader />
                  <div className="flex md:flex-1 md:flex-row flex-col h-full overflow-auto md:overflow-hidden items-center md:items-start">
                    <Sidebar />
                    <div className="flex-1 h-full">
                      {viewMode === "month" && (
                        <div className="w-full h-full">
                          <Month month={currentMonth} />
                        </div>
                      )}
                      {viewMode === "day" && (
                        <div className="w-full h-full">
                          <DayInfoModal />
                        </div>
                      )}
                      {viewMode === "week" && (
                        <div className="w-full h-full">
                          <WeeklyView />
                        </div>
                      )}
                      {viewMode === "workweek" && (
                        <div className="w-full h-full">
                          <WorkWeekView />
                        </div>
                      )}
                      {viewMode === "year" && (
                        <div className="w-full h-full">
                          <YearView />
                        </div>
                      )}
                      {viewMode === "label" && selectedLabel && (
                        <div className="w-full h-full">
                          <LabelEventsView
                            label={selectedLabel}
                            setShowLabelEventsModal={setShowLabelEventsModal}
                          />
                        </div>
                      )}
                      {viewMode === "labelManager" && (
                        <div className="w-full h-full">
                          <LabelManager />
                        </div>
                      )}
                      {viewMode === "profile" && (
                        <div className="w-full h-full">
                          <Profile />
                        </div>
                      )}
                      {viewMode === "backup" && (
                        <div className="w-full h-full">
                          <Backup />
                        </div>
                      )}
                      {viewMode === "calendarSettings" && (
                        <div className="w-full h-full">
                          <CalendarSettings />
                        </div>
                      )}
                    </div>
                    <div className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-800 text-white flex justify-around items-center p-8">
                      <button
                        onClick={() => setViewMode("profile")}
                        className="flex flex-col items-center"
                      >
                        <span className="material-icons">person</span>
                      </button>
                      <button
                        onClick={() => setViewMode("day")}
                        className="flex flex-col items-center"
                      >
                        <span className="material-icons">calendar_today</span>
                      </button>
                      <button
                        onClick={() => setShowEventModal(true)}
                        className="flex flex-col items-center"
                      >
                        <span className="material-icons">add</span>
                      </button>
                    </div>
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
