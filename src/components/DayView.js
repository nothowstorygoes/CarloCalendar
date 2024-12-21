import React, { useContext, useRef, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/it"; // Import Italian locale
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from 'react-i18next';

const EventItem = ({ evt, handleEventClick, handleCheckboxChange, handleDeleteEvent, getLabelColor }) => (
  <div className="flex justify-center items-center">
    <div
      key={evt.id}
      className="flex justify-between w-5/6 items-center mb-2 p-2 rounded cursor-pointer transition-all duration-300"
      style={{
        backgroundColor: evt.checked ? "rgba(128, 128, 128, 0.8)" : `${getLabelColor(evt.label)}80`,
        color: evt.checked ? "black" : "inherit",
      }}
    >
      <div className="flex items-center" onClick={() => handleEventClick(evt)}>
        <div className="flex justify-between items-center">
          <span
            className="w-2 h-2 rounded-full mr-4"
            style={{ backgroundColor: evt.checked ? "black" : getLabelColor(evt.label) }}
          ></span>
          <div>
            <span className="text-black-600 font-bold w-68">{evt.title}</span>
            <p
              className="text-sm w-96 dark:text-white"
              style={{
                color: evt.checked ? "black" : `${getLabelColor(evt.label)}`,
                textOverflow: "ellipsis",
              }}
            >
              {evt.description}
            </p>
          </div>
        </div>
        {evt.time && (
          <p className="text-sm" style={{ color: evt.checked ? "black" : `${getLabelColor(evt.label)}` }}>
            {" "}at {evt.time.hours}:{evt.time.minutes}
          </p>
        )}
      </div>
      <div className="flex flex-row items-center">
        <p className="text-sm mr-3" style={{ color: evt.checked ? "black" : `${getLabelColor(evt.label)}` }}>
          {evt.label}
        </p>
        {!evt.time && (
          <input
            type="checkbox"
            className="rounded-full w-6 h-6 cursor-pointer mr-6 ml-6"
            checked={evt.checked}
            onChange={(e) => handleCheckboxChange(e, evt)}
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteEvent(evt.id);
          }}
          className="material-icons cursor-pointer"
          style={{ color: evt.checked ? "black" : `${getLabelColor(evt.label)}` }}
        >
          delete
        </button>
      </div>
    </div>
  </div>
);

export default function DayInfoModal() {
  const {
    daySelected,
    setDaySelected,
    filteredEvents,
    dispatchCalEvent,
    setSelectedEvent,
    setShowEventModal,
    labels,
  } = useContext(GlobalContext);
  const modalRef = useRef(null);
  const { t } = useTranslation();

  const dayEvents = useMemo(() => filteredEvents.filter(
    (evt) => dayjs(evt.day).format("DD-MM-YY") === daySelected.format("DD-MM-YY")
  ), [filteredEvents, daySelected]);

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

  const handleCheckboxChange = (event, evt) => {
    event.stopPropagation();
    const updatedEvent = { ...evt, checked: !evt.checked };
    dispatchCalEvent({ type: "update", payload: updatedEvent });
    localStorage.setItem(
      "savedEvents",
      JSON.stringify(
        filteredEvents.map((e) => (e.id === evt.id ? updatedEvent : e))
      )
    );
  };

  const getLabelColor = (labelName) => {
    const label = labels.find((lbl) => lbl.name === labelName);
    return label ? label.color : "gray";
  };

  const [eventsWithTime, eventsWithoutTime] = useMemo(() => {
    const withTime = [];
    const withoutTime = [];
    dayEvents.forEach((evt) => {
      if (evt.time) {
        withTime.push(evt);
      } else {
        withoutTime.push(evt);
      }
    });
    withTime.sort((a, b) => {
      const aTime = dayjs(a.day).hour(a.time.hours).minute(a.time.minutes);
      const bTime = dayjs(b.day).hour(b.time.hours).minute(b.time.minutes);
      return aTime - bTime;
    });
    return [withTime, withoutTime];
  }, [dayEvents]);

  function capitalizeFirstLetter(string) {
    return string.replace(/\b\w/g, char => char.toUpperCase());
  }

  return (
    <div className="h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950 rounded-3xl">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative mt-8"
      >
        <div className="p-4 overflow-auto relative w-full">
          <div className="flex items-center justify-between mb-16 w-2/3 mx-auto space-x-1">
            <button
              onClick={handlePrevDay}
              className="bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center transition-all duration-300"
            >
              <span className="material-icons dark:text-zinc-50">chevron_left</span>
            </button>
            <h2 className="text-lg font-bold text-center text-gray-600 dark:text-zinc-50">
              {capitalizeFirstLetter(daySelected.locale("it").format("dddd, MMMM D, YYYY"))}
            </h2>
            <button
              onClick={handleNextDay}
              className="bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center transition-all duration-300"
            >
              <span className="material-icons dark:text-zinc-50">chevron_right</span>
            </button>
          </div>
          {dayEvents.length === 0 && (
            <p className="text-gray-500 dark:text-zinc-50 text-sm items-center flex justify-center">
               {t('no_events')}
            </p>
          )}
          {eventsWithoutTime.map((evt) => (
            <EventItem
              key={evt.id}
              evt={evt}
              handleEventClick={handleEventClick}
              handleCheckboxChange={handleCheckboxChange}
              handleDeleteEvent={handleDeleteEvent}
              getLabelColor={getLabelColor}
            />
          ))}
          
          {eventsWithTime.map((evt) => (
            <EventItem
              key={evt.id}
              evt={evt}
              handleEventClick={handleEventClick}
              handleCheckboxChange={handleCheckboxChange}
              handleDeleteEvent={handleDeleteEvent}
              getLabelColor={getLabelColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}