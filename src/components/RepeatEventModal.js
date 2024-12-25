import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

export default function RepeatEventModal({ onClose, onSave, repeatType, selectedDate }) {
  const { t } = useTranslation();
  const [endDate, setEndDate] = useState(selectedDate);
  const [customRepeat, setCustomRepeat] = useState({
    interval: 1,
    frequency: "monthly",
    daysOfWeek: [],
  });

  useEffect(() => {
    if (repeatType === "custom") {
      setCustomRepeat({ interval: 1, frequency: "week", daysOfWeek: [] });
    }
  }, [repeatType]);

  const handleSave = () => {
    const endDateObj = dayjs(endDate, 'ddd MMM D YYYY');
    const endYear = endDateObj.year();
    const endMonth = endDateObj.month();
    onSave({ repeatType, endDate, endYear, endMonth, customRepeat });
    onClose();
  };

  const handleDayOfWeekChange = (day, index) => {
    setCustomRepeat((prev) => {
      const daysOfWeek = prev.daysOfWeek.some(d => d[0] === index)
        ? prev.daysOfWeek.filter((d) => d[0] !== index)
        : [...prev.daysOfWeek, [index, day]];
      return { ...prev, daysOfWeek };
    });
  };

  const handleDateChange = (date) => {
    const formattedDate = dayjs(date).locale("en").format('ddd MMM D YYYY');
    setEndDate(formattedDate);
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-52 dark:bg-zinc-800 dark:bg-opacity-75">
      <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl w-1/3 z-52 p-4">
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg font-bold text-gray-600 dark:text-zinc-50">
            {t("repeat_event")}
          </h2>
          <button
            onClick={onClose}
            className="material-icons-outlined text-gray-400 dark:text-zinc-200"
          >
            close
          </button>
        </header>
        <div className="p-3">
          <div className="flex flex-col gap-y-4">
            {repeatType === "monthly" && (
              <div className="flex flex-col items-center gap-y-4">
                <label className="text-gray-600 dark:text-zinc-200">
                  {t("end_date")}
                </label>
                <DatePicker
                  selected={endDate}
                  showMonthYearPicker
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-40 p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                  locale="en-GB"
                />
              </div>
            )}
            {repeatType === "custom" && (
              <div className="flex flex-col items-center gap-y-4">
                <label className="text-gray-600 dark:text-zinc-200">
                  {t("custom_repeat")}
                </label>
                <div className="flex items-center gap-x-2">
                  <input
                    type="number"
                    value={customRepeat.interval}
                    onChange={(e) =>
                      setCustomRepeat({
                        ...customRepeat,
                        interval: e.target.value,
                      })
                    }
                    className="w-16 p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                  />
                  <select
                    value={customRepeat.frequency}
                    onChange={(e) =>
                      setCustomRepeat({
                        ...customRepeat,
                        frequency: e.target.value,
                      })
                    }
                    className="p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                  >
                    <option value="weekly">{t("weekly")}</option>
                    <option value="daily">{t("daily")}</option>
                  </select>
                </div>
                <label className="text-gray-600 dark:text-zinc-200">
                  {t("days_of_week")}
                </label>
                <div className="flex gap-x-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, index) => (
                      <button
                        key={day}
                        type="button"
                        className={`p-2 border rounded ${
                          customRepeat.daysOfWeek.some(d => d[0] === index)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-zinc-700 dark:text-white"
                        }`}
                        onClick={() => handleDayOfWeekChange(day, index)}
                      >
                        {t(`days.${day}`)}
                      </button>
                    )
                  )}
                </div>
                <label className="text-gray-600 dark:text-zinc-200">
                  {t("end_date")}
                </label>
                <div className="h-full">
                    <DatePicker
                      selected={endDate ? new Date(endDate) : null}
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy"
                      className="w-full p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                      locale="en-GB"
                    />
                  </div>
              </div>
            )}
            {repeatType === "yearly" && (
              <div className="flex flex-col items-center gap-y-4">
                <label className="text-gray-600 dark:text-zinc-200">
                  {t("end_year")}
                </label>
                <DatePicker
                  showYearPicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="yyyy"
                  className="w-32 p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                  locale="en-GB"
                />
              </div>
            )}
          </div>
        </div>
        <footer className="flex justify-end border-t p-3 mt-5">
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded text-white"
          >
            {t("save")}
          </button>
        </footer>
      </div>
    </div>
  );
}