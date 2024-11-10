import React, { useContext, useRef } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";
import CreateEventButton from "./CreateEventButton"; // Import the CreateEventButton component

export default function DayInfoModal() {
  const { daySelected, setShowDayInfoModal, filteredEvents } = useContext(GlobalContext);
  const modalRef = useRef(null);

  const dayEvents = filteredEvents.filter(
    (evt) => dayjs(evt.day).format("DD-MM-YY") === daySelected.format("DD-MM-YY")
  );

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setShowDayInfoModal(false);
    }
  };

  return (
    <div
      className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50"
      onClick={handleClickOutside}
    >
      <div ref={modalRef} className="bg-white rounded-lg shadow-2xl w-1/4 overflow-hidden">
        <header className="bg-gray-100 px-4 py-2 flex justify-between items-center rounded-t-lg">
          <span className="material-icons-outlined text-gray-400">
            drag_handle
          </span>
          <button onClick={() => setShowDayInfoModal(false)}>
            <span className="material-icons-outlined text-gray-400">
              close
            </span>
          </button>
        </header>
        <div className="p-3">
          <h2 className="text-lg font-bold">{daySelected.format("dddd, MMMM DD")}</h2>
          {dayEvents.length === 0 ? (
            <p className="text-gray-600">You have no upcoming events today.</p>
          ) : (
            <div className="space-y-2"> {/* Add space between events */}
              {dayEvents.map((evt, idx) => (
                <div key={idx} className={`p-2 rounded bg-${evt.label}-200 flex items-start`}>
                  <span className="mr-2 mt-1 text-gray-600">•</span> {/* Bullet point */}
                  <div>
                    <p className="font-semibold">{evt.title}</p>
                    <p className="text-gray-600">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <CreateEventButton /> {/* Add the CreateEventButton component */}
          </div>
        </div>
      </div>
    </div>
  );
}