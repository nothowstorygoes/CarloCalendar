import React, { useContext, useRef } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";
import CreateEventButton from "./CreateEventButton"; // Import the CreateEventButton component

export default function DayInfoModal() {
  const { daySelected, setShowDayInfoModal, filteredEvents, showEventModal, dispatchCalEvent, setSelectedEvent, setShowEventModal } = useContext(GlobalContext);
  const modalRef = useRef(null);

  const dayEvents = filteredEvents.filter(
    (evt) => dayjs(evt.day).format("DD-MM-YY") === daySelected.format("DD-MM-YY")
  );

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setShowDayInfoModal(false);
    }
  };

  const handleDeleteEvent = (eventId) => {
    dispatchCalEvent({ type: "delete", payload: { id: eventId } });
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  return (
    <div
      className={`h-screen w-full fixed left-0 top-0 flex justify-center items-center ${showEventModal ? 'bg-opacity-0' : 'bg-black bg-opacity-50'}`}
      onClick={handleClickOutside}
    >
      <div ref={modalRef} className="bg-white rounded-lg shadow-2xl w-1/3 overflow-hidden">
        <header className="bg-gray-100 px-4 py-2 flex justify-between items-center rounded-t-lg">
          <span className="material-icons-outlined text-gray-400">
            drag_handle
          </span>
          <button onClick={() => setShowDayInfoModal(false)} className="material-icons-outlined text-gray-400">
            close
          </button>
        </header>
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">{daySelected.format("dddd, MMMM D, YYYY")}</h2>
          {dayEvents.map((evt) => (
            <div key={evt.id} className={`flex justify-between items-center mb-2 bg-${evt.label}-200 p-2 rounded`} onClick={() => handleEventClick(evt)}>
              <div className="flex items-center">
                <span className={`bg-${evt.label}-500 w-2 h-2 rounded-full mr-2`}></span>
                <div>
                  <span className="text-gray-600 font-bold">{evt.title}</span>
                  <p className="text-gray-500 text-sm">{evt.description}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the modal when clicking on the delete button
                  handleDeleteEvent(evt.id);
                }}
                className="material-icons-outlined text-black-600 cursor-pointer"
              >
                delete
              </button>
            </div>
          ))}
        </div>
        <footer className="bg-gray-100 px-4 py-2 flex justify-end items-center rounded-b-lg">
          <CreateEventButton />
        </footer>
      </div>
    </div>
  );
}