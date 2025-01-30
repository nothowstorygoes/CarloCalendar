import React, { useState, useContext } from "react";
import GlobalContext from "../context/GlobalContext";

export default function Calendars() {
  const {
    calendars,
    setCalendarsVisibility,
    calendarsVisibility,
    labels,
    setSelectedLabel,
    setViewMode,
  } = useContext(GlobalContext);
  const [collapsedCalendars, setCollapsedCalendars] = useState({});

  const handleLabelClick = (label) => {
    setSelectedLabel(label);
    setViewMode("label");
  };

  const toggleCalendarVisibility = (calendarId) => {
    setCalendarsVisibility((prev) => ({
      ...prev,
      [calendarId]: !prev[calendarId],
    }));
    console.log(calendarsVisibility[calendarId]);
  };

  const toggleCollapse = (calendarId) => {
    setCollapsedCalendars((prev) => ({
      ...prev,
      [calendarId]: !prev[calendarId],
    }));
    console.log(labels);
  };

  const handleSettingsClick = () => {
    setViewMode("calendarSettings");
  };

  const handleVisibilityAll = () => {
    const allVisible = Object.values(calendarsVisibility).every((visibility) => visibility);
    const newVisibility = {};
    calendars.forEach((calendar) => {
      newVisibility[calendar.id] = !allVisible;
    });
    setCalendarsVisibility(newVisibility);
  };

  return (
    <React.Fragment>
      <div className="h-96 overflow-hidden w-64">
        <div className="flex justify-between items-center">
          <p className="font-bold text-black dark:text-white">Calendari</p>
          <div>
          <button
            className="material-icons-outlined text-black dark:text-white"
            onClick={handleVisibilityAll}
          >
            {Object.values(calendarsVisibility).every((visibility) => visibility) ? (
              <div className="material-icons-outlined text-black dark:text-white">
                visibility
              </div>
            ) : (
              <div className="material-icons-outlined text-black dark:text-white">
                visibility_off
              </div>
            )}
          </button>
          <span
            className="material-icons text-gray-500 ml-8 cursor-pointer"
            onClick={handleSettingsClick}
          >
            settings
          </span>
          </div>  
        </div>
        <div className="mt-6 ml-4 h-96 overflow-y-auto custom-scrollbar">
          {calendars.map((calendar) => (
            <div key={calendar.id} className="mb-4 mr-4">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleCollapse(calendar.id)}
              >
                <span className="font-bold text-gray-600 dark:text-zinc-50">
                  {calendar.name}
                </span>
                <button
                  className="material-icons"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCalendarVisibility(calendar.id);
                  }}
                >
                  {calendarsVisibility[calendar.id] ? (
                    <div className="material-icons-outlined text-black dark:text-white">
                      visibility
                    </div>
                  ) : (
                    <div className="material-icons-outlined text-black dark:text-white">
                      visibility_off
                    </div>
                  )}
                </button>
              </div>
              <div
                className={`transition-all duration-3000 ease-in-out overflow-hidden ${
                  collapsedCalendars[calendar.id] ? "max-h-0" : "max-h-96"
                }`}
              >
                <ul className="ml-2 mt-2">
                  {labels
                    .filter((label) => {
                      return parseInt(label.calendarId, 10) === calendar.id;
                    })
                    .sort((a, b) => a.code - b.code) // Sort labels by ascending order of code
                    .map((label) => (
                      <div
                        key={label.code}
                        className="w-40 flex items-center justify-between p-1 rounded cursor-pointer text-black font-bold mb-2 text-sm"
                        style={{ backgroundColor: label.color }}
                        onClick={() => handleLabelClick(label)}
                      >
                        <p className="truncate">{label.name}</p>
                        <p>{label.code}</p>
                      </div>
                    ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--scrollbar-track-bg);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      </div>
    </React.Fragment>
  );
}