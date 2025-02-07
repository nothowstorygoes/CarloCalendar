import React, { useState, useContext } from "react";
import dayjs from "dayjs";
import GlobalContext from "../context/GlobalContext";

const DaySelector = ({ onClose }) => {
  const { setDaySelected } = useContext(GlobalContext);
  const currentYear = dayjs().year();
  const years = Array.from({ length: 71 }, (_, i) => currentYear - 30 + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedDay, setSelectedDay] = useState(dayjs().date());

  const daysInMonth = dayjs(`${selectedYear}-${selectedMonth}-01`).daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDayChange = (e) => setSelectedDay(e.target.value);
  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handleYearChange = (e) => setSelectedYear(e.target.value);

  const handleSubmit = () => {
    const selectedDate = dayjs(`${selectedYear}-${selectedMonth}-${selectedDay}`);
    setDaySelected(selectedDate);
    onClose();
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-50 dark:bg-zinc-800 dark:bg-opacity-75">
      <div className="bg-white dark:bg-zinc-950 rounded-4xl shadow-2xl w-5/4 z-50">
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-4 flex justify-between items-center rounded-t-4xl">
          <h2 className="text-gray-600 dark:text-zinc-50 ml-4">Select a Date</h2>
          <button
            onClick={onClose}
            className="material-icons-outlined text-gray-400 dark:text-zinc-200 mr-2"
          >
            close
          </button>
        </header>
        <div className="p-4">
          <div className="flex space-x-4 mb-4 justify-center mt-2">
            <select value={selectedDay} onChange={handleDayChange} className="border rounded dark:text-white dark:bg-zinc-900">
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <select value={selectedMonth} onChange={handleMonthChange} className=" border rounded dark:text-white dark:bg-zinc-900">
              {months.map((month) => (
                <option key={month} value={month}>
                  {dayjs().month(month - 1).format("MMMM")}
                </option>
              ))}
            </select>
            <select value={selectedYear} onChange={handleYearChange} className="border rounded dark:text-white dark:bg-zinc-900">
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <footer className="flex justify-end p-3 py-6">
          <button
            onClick={onClose}
            className="hover:bg-zinc-900 px-6 py-2 rounded-4xl text-white mr-4"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-4xl text-white mr-4"
          >
            Select
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DaySelector;