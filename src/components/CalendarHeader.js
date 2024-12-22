import React, { useContext, useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/it"; // Import Italian locale
import GlobalContext from "../context/GlobalContext";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleReset() {
    setMonthIndex(dayjs().month());
    setYear(dayjs().year());
    setDaySelected(dayjs());
  }

  function handleViewModeChange(mode) {
    setViewMode(mode);
    setShowLabelEventsModal(false); // Hide LabelEventsView
    toggleLabelManager(false); // Hide LabelManager
    setDropdownOpen(false); // Close dropdown menu
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function handleDarkModeToggle() {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  const getViewModeLabel = () => {
    switch (viewMode) {
      case "day":
        return t("day");
      case "week":
        return t("week");
      case "workweek":
        return t("workweek");
      case "month":
        return t("month");
      case "year":
        return t("year");
      default:
        return t("view");
    }
  };

  return (
    <header className="px-4 py-2 flex items-center justify-between bg-white dark:bg-zinc-900">
      <div className="flex items-center ml-1">
        <img src={logo} alt="calendar" className="mr-2 w-12 h-12" />
        <h1 className="mr-16 text-xl text-gray-500 dark:text-zinc-50 font-bold">
          CarloCalendar
        </h1>
        <h2 className="ml-10 text-xl text-gray-500 dark:text-zinc-50 font-bold mr-4">
          {capitalizeFirstLetter(dayjs(new Date(year, monthIndex)).format("MMMM YYYY"))}
        </h2>
        <button
          onClick={handleReset}
          className="border rounded py-2 px-4 ml-5 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-50"
        >
          {t("today")}
        </button>
      </div>
      <button
        onClick={handleDarkModeToggle}
        className="top-4 ml-70 pt-3 text-gray-800 dark:text-zinc-50 p-1 rounded"
      >
        <span className="material-icons">
          {darkMode ? "light_mode" : "dark_mode"}
        </span>
      </button>
      <div className="relative mr-12">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="border rounded-3xl py-2 px-4 ml-5 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-50 flex items-center"
        >
          {getViewModeLabel()}
          <span className="material-icons ml-2">arrow_drop_down</span>
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10">
            <button
              onClick={() => handleViewModeChange("day")}
              className={`block w-full text-left px-4 py-2 text-gray-800 dark:text-zinc-50 ${
                viewMode === "day" ? "bg-blue-500 dark:bg-blue-700 text-white" : ""
              }`}
            >
              {t("day")}
            </button>
            <button
              onClick={() => handleViewModeChange("week")}
              className={`block w-full text-left px-4 py-2 text-gray-800 dark:text-zinc-50 ${
                viewMode === "week" ? "bg-blue-500 dark:bg-blue-700 text-white" : ""
              }`}
            >
              {t("week")}
            </button>
            <button
              onClick={() => handleViewModeChange("workweek")}
              className={`block w-full text-left px-4 py-2 text-gray-800 dark:text-zinc-50 ${
                viewMode === "workweek" ? "bg-blue-500 dark:bg-blue-700 text-white" : ""
              }`}
            >
              {t("workweek")}
            </button>
            <button
              onClick={() => handleViewModeChange("month")}
              className={`block w-full text-left px-4 py-2 text-gray-800 dark:text-zinc-50 ${
                viewMode === "month" ? "bg-blue-500 dark:bg-blue-700 text-white" : ""
              }`}
            >
              {t("month")}
            </button>
            <button
              onClick={() => handleViewModeChange("year")}
              className={`block w-full text-left px-4 py-2 text-gray-800 dark:text-zinc-50 ${
                viewMode === "year" ? "bg-blue-500 dark:bg-blue-700 text-white" : ""
              }`}
            >
              {t("year")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}