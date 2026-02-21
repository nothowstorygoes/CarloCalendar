import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, getDoc, query, where } from "firebase/firestore";
import CalendarHeader from "./components/CalendarHeader";
import Sidebar from "./components/Sidebar";
import Month from "./components/Month";
import DayInfoModal from "./components/DayView";
import WeeklyView from "./components/WeeklyView";
import WorkWeekView from "./components/WorkWeekView"; 
import EventModal from "./components/EventModal";
import LabelManager from "./components/LabelManager";
import LabelEventsView from "./components/LabelEventsView";
import GlobalContext from "./context/GlobalContext";
import YearView from "./components/YearView";
import AcceptInvite from "./components/AcceptInvite"
import { getMonth } from "./util";
import dayjs from "dayjs";
import Backup from "./components/Backup";
import Profile from "./components/Profile";
import { auth, db } from "./firebase"; 
import Login from "./components/login"; 
import Spinner from "./assets/spinner"; 
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
          // 1. SCARICA I DATI PERSONALI E I PUNTATORI
          const eventsRef = collection(db, `users/${user.uid}/events`);
          const labelsRef = collection(db, `users/${user.uid}/labels`);
          const sharedPointersRef = collection(db, `users/${user.uid}/shared_calendars`);

          const [eventsSnapshot, labelsSnapshot, sharedPointersSnap] = await Promise.all([
            getDocs(eventsRef),
            getDocs(labelsRef),
            getDocs(sharedPointersRef)
          ]);

          let allEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          let allLabels = labelsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // 2. SCARICA I DATI CONDIVISI DAGLI OWNER
          for (const pointer of sharedPointersSnap.docs) {
            const { ownerId, calendarId } = pointer.data(); 

            try {
              const realCalendarRef = doc(db, `users/${ownerId}/calendars/${calendarId}`);
              const realCalendarSnap = await getDoc(realCalendarRef);

              if (realCalendarSnap.exists()) {
                const internalId = realCalendarSnap.data().id;

                // A. Scarica gli eventi dell'Owner
                const eventsQuery = query(
                  collection(db, `users/${ownerId}/events`),
                  where("calendarId", "==", internalId)
                );
                const sharedEventsSnap = await getDocs(eventsQuery);
                
                const sharedEvents = sharedEventsSnap.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  isShared: true,
                  calendarId: calendarId 
                }));
                allEvents = [...allEvents, ...sharedEvents];

                // B. Scarica le label dell'Owner
                const labelsQuery = query(
                  collection(db, `users/${ownerId}/labels`),
                  where("calendarId", "==", internalId) 
                );
                const sharedLabelsSnap = await getDocs(labelsQuery);
                
                const sharedLabels = sharedLabelsSnap.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  isShared: true,
                  calendarId: calendarId 
                }));
                
                allLabels = [...allLabels, ...sharedLabels];
              }
            } catch (pointerError) {
              // Accesso negato o calendario cancellato. Non facciamo crashare l'app.
              console.warn(`Impossibile scaricare gli eventi del calendario condiviso ${calendarId}.`);
              // (Il puntatore viene già eliminato nel ContextWrapper, qui ci basta ignorare l'errore)
            }
          }

          // Rimuovi eventuali label duplicate
          const uniqueLabels = Array.from(new Map(allLabels.map(item => [item.id, item])).values());

          dispatchCalEvent({ type: "set", payload: allEvents });
          setLabels(uniqueLabels);
          
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
        <Route path="/accept-invite" element={<AcceptInvite />} />
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
                      {viewMode === "month" && <Month month={currentMonth} />}
                      {viewMode === "day" && <DayInfoModal />}
                      {viewMode === "week" && <WeeklyView />}
                      {viewMode === "workweek" && <WorkWeekView />}
                      {viewMode === "year" && <YearView />}
                      {viewMode === "label" && selectedLabel && (
                        <LabelEventsView
                          label={selectedLabel}
                          setShowLabelEventsModal={setShowLabelEventsModal}
                        />
                      )}
                      {viewMode === "labelManager" && <LabelManager />}
                      {viewMode === "profile" && <Profile />}
                      {viewMode === "backup" && <Backup />}
                      {viewMode === "calendarSettings" && <CalendarSettings />}
                    </div>
                    <div className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-800 text-white flex justify-around items-center p-8">
                      <button onClick={() => setViewMode("profile")} className="flex flex-col items-center">
                        <span className="material-icons">person</span>
                      </button>
                      <button onClick={() => setViewMode("day")} className="flex flex-col items-center">
                        <span className="material-icons">calendar_today</span>
                      </button>
                      <button onClick={() => setShowEventModal(true)} className="flex flex-col items-center">
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