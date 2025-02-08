import React, { useContext, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/it"; // Import Italian locale
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png";
import SearchBox from "./SearchBox";
import { useEffect } from "react";
import blankProfilePic from "../assets/blank.png"; // Import the blank profile picture


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
    setShowEventModal,
    setSelectedEvent,
  } = useContext(GlobalContext);
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [propic, setPropic] = useState(blankProfilePic); // Initialize propic with blank profile picture


  function handleReset() {
    setMonthIndex(dayjs().month());
    setYear(dayjs().year());
    setDaySelected(dayjs());
  }


  useEffect(() => {
    const savedPropic = localStorage.getItem("propic");
    if (savedPropic) {
      setPropic(`data:image/png;base64,${savedPropic}`);
    }
  }, []);


  function handleViewModeChange(mode) {
    setViewMode(mode);
    setShowLabelEventsModal(false); // Hide LabelEventsView
    toggleLabelManager(false); // Hide LabelManager
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
      document.querySelector('meta[name="theme-color"]').setAttribute("content", "#18181b");
    } else {
      document.documentElement.classList.remove("dark");
      document.querySelector('meta[name="theme-color"]').setAttribute("content", "#ffffff");
    }
  }

  const handlePrevYear = () => {
    setYear(year - 1);
  };

  const handleNextYear = () => {
    setYear(year + 1);
  };

  const handlePrevMonth = () => {
    setMonthIndex(monthIndex - 1);
  };

  const handleNextMonth = () => {
    setMonthIndex(monthIndex + 1);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  return (
    <header className="px-4 py-4 md:py-2 flex items-center justify-between bg-white dark:bg-zinc-900">
      <div className="flex items-center ml-1">
        <img src={logo} alt="calendar" className="mr-2 w-12 h-12" />
        <h1 className="md:mr-16 mr-4 text-xl text-gray-500 dark:text-zinc-50 font-bold">
          CarloCalendar
        </h1>
        <button
          onClick={handleDarkModeToggle}
          className="md:hidden top-4 pt-3 text-gray-800 dark:text-zinc-50 p-1 rounded"
        >
          <span className="material-icons">
            {darkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>
        {viewMode === "month" ? "" :
          <h2 className="!hidden md:!flex ml-10 text-xl text-gray-500 dark:text-zinc-50 font-bold">
            {capitalizeFirstLetter(
              dayjs(new Date(year, monthIndex)).format("MMMM YYYY")
            )}
          </h2>}
          {viewMode === "day" ? (
          <button
          onClick={handleReset}
          className="md:hidden flex border rounded-3xl py-2 px-6 ml-5 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-50"
        >
          {t("today")}
        </button>
          ) : ""}
        <button
          onClick={handleReset}
          className="hidden md:!flex flex border rounded-3xl py-2 px-6 ml-5 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-50"
        >
          {t("today")}
        </button>
      </div>
      <div className="!hidden md:!flex items-center justify-center">
        <button
          onClick={() => setShowSearchBox(true)}
          className="top-4 mr-5 pt-3 text-gray-800 dark:text-zinc-50 p-1 rounded"
        >
          <span className="material-icons">search</span>
        </button>
        {showSearchBox && (
          <SearchBox
            setShowSearchBox={setShowSearchBox}
            handleEventClick={handleEventClick}
          />
        )}
        <button
          onClick={handleDarkModeToggle}
          className="top-4 mr-5 pt-3 text-gray-800 dark:text-zinc-50 p-1 rounded"
        >
          <span className="material-icons">
            {darkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>
        <div className="flex items-center mr-5">
          <button
            onClick={() => handleViewModeChange("day")}
            className={`border rounded-3xl py-2 px-4 mr-2 ml-1 flex items-center text-gray-800 dark:text-zinc-50 ${
              viewMode === "day"
                ? "bg-blue-500 dark:bg-blue-700"
                : "bg-gray-200 dark:bg-zinc-700"
            }`}
          >
            {t("day")}
          </button>
          <button
            onClick={() => handleViewModeChange("week")}
            className={`border rounded-3xl py-2 px-4 mr-2 ml-1 flex items-center text-gray-800 dark:text-zinc-50 ${
              viewMode === "week"
                ? "bg-blue-500 dark:bg-blue-700"
                : "bg-gray-200 dark:bg-zinc-700"
            }`}
          >
            {t("week")}
          </button>
          <button
            onClick={() => handleViewModeChange("workweek")}
            className={`border rounded-3xl py-2 px-4 mr-2 ml-1 flex items-center justify-center text-gray-800 dark:text-zinc-50 ${
              viewMode === "workweek"
                ? "bg-blue-500 dark:bg-blue-700"
                : "bg-gray-200 dark:bg-zinc-700"
            }`}
          >
            {t("workweek")}
          </button>
          <button
            onClick={() => handleViewModeChange("month")}
            className={`border rounded-3xl py-2 px-4 mr-2 ml-1 flex items-center text-gray-800 dark:text-zinc-50 ${
              viewMode === "month"
                ? "bg-blue-500 dark:bg-blue-700"
                : "bg-gray-200 dark:bg-zinc-700"
            }`}
          >
            {t("month")}
          </button>
          <button
            onClick={() => handleViewModeChange("year")}
            className={`border rounded-3xl py-2 px-4 ml-1 flex items-center text-gray-800 dark:text-zinc-50 ${
              viewMode === "year"
                ? "bg-blue-500 dark:bg-blue-700"
                : "bg-gray-200 dark:bg-zinc-700"
            }`}
          >
            {t("year")}
          </button>
        </div>
        {viewMode === "year" && (
          <div className="flex items-center mr-5">
            <button
              onClick={handlePrevYear}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons dark:text-zinc-50">chevron_left</span>
            </button>
            <span className="text-xl text-gray-500 dark:text-zinc-50 font-bold mx-4">
              {year}
            </span>
            <button
              onClick={handleNextYear}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons dark:text-zinc-50">chevron_right</span>
            </button>
          </div>
        )}
        {viewMode === "month" && (
          <div className="flex items-center mr-5">
            <button
              onClick={handlePrevMonth}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons dark:text-zinc-50">chevron_left</span>
            </button>
            <span className="text-xl text-gray-500 dark:text-zinc-50 font-bold mx-4">
              {capitalizeFirstLetter(
                dayjs(new Date(year, monthIndex)).format("MMMM YYYY")
              )}
            </span>
            <button
              onClick={handleNextMonth}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-zinc-50 rounded-full p-2 w-10 h-10 flex items-center justify-center"
            >
              <span className="material-icons dark:text-zinc-50">chevron_right</span>
            </button>
          </div>
        )}
        <button 
      onClick={() => handleViewModeChange("profile")}
      className="rounded-full overflow-hidden w-10 h-10 ml-4"
    >
      <img
        src={propic}
        alt="Profile"
        className="w-full h-full object-cover"
      />
    </button>
      </div>
    </header>
  );
}