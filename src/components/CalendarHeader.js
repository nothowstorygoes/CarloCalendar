import React, { useContext } from "react";
import dayjs from "dayjs";
import "dayjs/locale/it"; // Import Italian locale
import GlobalContext from "../context/GlobalContext";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png";

export default function CalendarHeader() {
  const {
    monthIndex,
    setMonthIndex,
    year,
    setYear,
    viewMode,
    setViewMode,
    setDaySelected,
    setShowLabelEventsModal,
    toggleLabelManager,
  } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);

  function handleReset() {
    setMonthIndex(dayjs().month());
    setYear(dayjs().year());
    setDaySelected(dayjs());
  }

  function handleViewModeChange(mode) {
    setViewMode(mode);
    setShowLabelEventsModal(false); // Hide LabelEventsView
    toggleLabelManager(false); // Hide LabelManager
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <header className="px-4 py-2 flex items-center justify-between bg-white dark:bg-zinc-900">
      <div className="flex items-center ml-1">
        <img src={logo} alt="calendar" className="mr-2 w-12 h-12" />
        <h1 className="mr-16 text-xl text-gray-500 dark:text-zinc-50 font-bold">
          CarloCalendar
        </h1>
        <h2 className="ml-10 text-xl text-gray-500 dark:text-zinc-50 font-bold mr-4">
          {capitalizeFirstLetter(
            dayjs(new Date(year, monthIndex)).format("MMMM YYYY")
          )}
        </h2>
        <button
          onClick={handleReset}
          className="border rounded py-2 px-4 mr-5 ml-5 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-50"
        >
          {t("today")}
        </button>
      </div>
      <button
        onClick={toggleDarkMode}
        className="top-4 ml-96 pt-3 text-gray-800 dark:text-zinc-50 p-1 rounded"
      >
        <span className="material-icons">
          {darkMode ? "light_mode" : "dark_mode"}
        </span>
      </button>
      <div className="flex items-center">
        <button
          onClick={() => handleViewModeChange("day")}
          className={`border rounded py-2 px-4 mr-5 ml-1 flex items-center text-gray-800 dark:text-zinc-50 ${
            viewMode === "day"
              ? "bg-gray-400 dark:bg-zinc-900"
              : "bg-gray-200 dark:bg-zinc-700"
          }`}
        >
          {t("day")}
        </button>
        <button
          onClick={() => handleViewModeChange("week")}
          className={`border rounded py-2 px-4 mr-5 ml-1 flex items-center text-gray-800 dark:text-zinc-50 ${
            viewMode === "week"
              ? "bg-gray-400 dark:bg-zinc-900"
              : "bg-gray-200 dark:bg-zinc-700"
          }`}
        >
          {t("week")}
        </button>
        <button
          onClick={() => handleViewModeChange("month")}
          className={`border rounded py-2 px-4 mr-2 ml-1 flex items-center text-gray-800 dark:text-zinc-50 ${
            viewMode === "month"
              ? "bg-gray-400 dark:bg-zinc-900"
              : "bg-gray-200 dark:bg-zinc-700"
          }`}
        >
          {t("month")}
        </button>
      </div>
    </header>
  );
}
