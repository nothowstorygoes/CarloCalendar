import React, { useContext, useRef } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";
import CreateEventButton from "./CreateEventButton"; // Import the CreateEventButton component

export default function DayInfoModal() {
  const {
    daySelected,
    setDaySelected,
    filteredEvents,
    dispatchCalEvent,
    setSelectedEvent,
    setShowEventModal,
  } = useContext(GlobalContext);
  const modalRef = useRef(null);

  const dayEvents = filteredEvents.filter(
    (evt) =>
      dayjs(evt.day).format("DD-MM-YY") === daySelected.format("DD-MM-YY")
  );

  const handleDeleteEvent = (eventId) => {
    dispatchCalEvent({ type: "delete", payload: { id: eventId } });
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handlePrevDay = () => {
    setDaySelected(daySelected.subtract(1, "day"));
  };

  const handleNextDay = () => {
    setDaySelected(daySelected.add(1, "day"));
  };

  return (
    <div
      className="h-full w-full fixed left-0 top-0 flex justify-center items-center"
    >
      
      <div
        ref={modalRef}
        className="bg-white w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative ml-64 mt-16"
      >
<hr></hr>
        <div className="p-4 overflow-auto relative">
          <div className="flex items-center justify-between mb-16 w-2/3 mx-auto space-x-1">
            <button
              onClick={handlePrevDay}
              className="bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons">chevron_left</span>
            </button>
            
            <h2 className="text-lg font-bold text-center">
              {daySelected.format("dddd, MMMM D, YYYY")}
            </h2>
            <button
              onClick={handleNextDay}
              className="bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
          {dayEvents.length === 0 && (
            <p className="text-gray-500 text-sm items-center flex justify-center">
              There are no upcoming events today.
            </p>
          )}
          {dayEvents.map((evt) => (
            <div className="flex justify-center items-center">
            <div
              key={evt.id}
              className={`flex justify-between w-5/6 items-center mb-2 bg-${evt.label}-200 p-2 rounded`}
              onClick={() => handleEventClick(evt)}
            >
              <div className="flex items-center">
                <span
                  className={`bg-${evt.label}-500 w-2 h-2 rounded-full mr-4`}
                ></span>
                <div>
                  <span className="text-black-600 font-bold">{evt.title}</span>
                  <p className="text-gray-500 text-sm">{evt.description}</p>
                </div>
              </div>
              <div className="flex flex-row items-center">
              <p className= {`text-gray-700 text-sm mr-3`}>{evt.label}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the modal when clicking on the delete button
                  handleDeleteEvent(evt.id);
                }}
                className="material-icons-outlined text-red-600 cursor-pointer"
              >
                delete
              </button>
              </div>
            </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 right-0 m-4">
          <CreateEventButton />
        </div>
      </div>
    </div>
  );
}