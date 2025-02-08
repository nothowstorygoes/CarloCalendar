import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import it from "date-fns/locale/it";

export default function RepeatEventModal({
  onClose,
  onSave,
  repeatType,
  selectedDate,
  setShowRepeatModal,
}) {
  const { t } = useTranslation();
  const [endDate, setEndDate] = useState(selectedDate);
  const [customRepeat, setCustomRepeat] = useState({
    interval: 1,
    frequency: "monthly",
    daysOfWeek: [],
  });
  const [endOption, setEndOption] = useState("date"); // "date", "never", "occurrences"
  const [occurrences, setOccurrences] = useState(1);

  useEffect(() => {
    if (repeatType === "custom") {
      setCustomRepeat({ interval: 1, frequency: "week", daysOfWeek: [] , dayOfMonth: 1});
    }
    if (repeatType === "yearly") {
      setCustomRepeat({ interval: 1, frequency: "yearly", daysOfWeek: [] });
    }
  }, [repeatType]);

  const handleSave = () => {
    const endDateObj = dayjs(endDate, "ddd MMM D YYYY");
    const endYear = endDateObj.year();
    const endMonth = endDateObj.month();
    console.log(customRepeat.daysOfWeek);
    console.log({
      repeatType,
      endDate,
      endYear,
      endMonth,
      customRepeat,
      endOption,
      occurrences,
    });
    onSave({
      repeatType,
      endDate,
      endYear,
      endMonth,
      customRepeat,
      endOption,
      occurrences,
    });
    setShowRepeatModal(false);
  };

  const handleDayOfWeekChange = (day, index) => {
    setCustomRepeat((prev) => {
      const daysOfWeek = prev.daysOfWeek.some((d) => d[0] === index)
        ? prev.daysOfWeek.filter((d) => d[0] !== index)
        : [...prev.daysOfWeek, [index, day]];
      return { ...prev, daysOfWeek };
    });
  };

  const handleDateChange = (date) => {
    const formattedDate = dayjs(date).locale("en").format("ddd MMM D YYYY");
    setEndDate(formattedDate);
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-52 dark:bg-zinc-800 dark:bg-opacity-75">
      <div className="w-[25rem] md:w-auto bg-white dark:bg-zinc-950 rounded-4xl shadow-2xl w-2/5 z-52">
        <header className="w-full bg-gray-100 dark:bg-zinc-900 px-4 py-4 flex justify-between items-center rounded-t-4xl">
          <h2 className="text-lg font-bold text-gray-600 dark:text-zinc-50 ml-4">
            {t("repeat_event")}
          </h2>
          <button
            onClick={onClose}
            className="material-icons-outlined text-gray-400 dark:text-zinc-200 mr-4"
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
                <div className="flex flex-col mt-10 md:mt-0 md:flex-row gap-x-8 gap-y-4 mb-10 md:mb-4">
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="endOption"
                      value="date"
                      checked={endOption === "date"}
                      onChange={() => setEndOption("date")}
                      className="mr-2"
                    />
                    {t("specific_date")}
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      name="endOption"
                      value="occurrences"
                      checked={endOption === "occurrences"}
                      onChange={() =>
                        setEndOption(
                          endOption === "occurrences" ? "date" : "occurrences"
                        )
                      }
                      className="mr-2 rounded-full"
                    />
                    {t("after")}
                    <input
                      type="number"
                      value={occurrences}
                      onChange={(e) => setOccurrences(e.target.value)}
                      className=" mr-2 ml-2 w-16 p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                      min="1"
                      disabled={endOption !== "occurrences"}
                    />
                    {t("occurrences")}
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="endOption"
                      value="never"
                      checked={endOption === "never"}
                      onChange={() => setEndOption("never")}
                      className="mr-2"
                    />
                    {t("never")}
                  </label>
                </div>
                {endOption === "date" && (
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-40 p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                    locale={it}
                  />
                )}
              </div>
            )}
            {repeatType === "custom" && (
              <div className="flex flex-col items-center gap-y-4">
                <label className="text-gray-600 dark:text-zinc-200">
                  {t("custom_repeat")}
                </label>
                <div className="flex items-center gap-x-2">
                  <p className="text-black dark:text-white">Ogni</p>
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
                    className="p-2 px-4 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                  >
                    <option value="">
                      Seleziona frequenza
                    </option>
                    <option value="week">Settimane</option>
                    <option value="monthlyCustom">Mesi</option>
                  </select>
                </div>

                {customRepeat.frequency === "week" && (
                  <div className="flex flex-col items-center gap-y-4">
                    <label className="text-gray-600 dark:text-zinc-200">
                      {t("days_of_week")}
                    </label>
                    <div className="md:flex md:flex-row md:gap-x-2 grid grid-cols-4 gap-x-4 gap-y-4">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day, index) => (
                          <button
                            key={day}
                            type="button"
                            className={`p-2 border rounded ${
                              customRepeat.daysOfWeek.some(
                                (d) => d[0] === index
                              )
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
                  </div>
                )}
                {customRepeat.frequency === "monthlyCustom" && (
                  <div className="flex flex-col items-center gap-y-4">
                    <label className="text-gray-600 dark:text-zinc-200">
                      {t("day_of_month")}
                    </label>
                    <select
                      value={customRepeat.dayOfMonth}
                      onChange={(e) =>
                        setCustomRepeat({
                          ...customRepeat,
                          dayOfMonth: parseInt(e.target.value, 10),
                        })
                      }
                      className="p-2 px-6 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
                <label className="text-gray-600 dark:text-zinc-200">
                  {t("end_date")}
                </label>
                <div className="flex flex-col gap-y-4 md:flex-row gap-x-8 mt-6 md:mt-0 mb-4">
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="endOption"
                      value="date"
                      checked={endOption === "date"}
                      onChange={() => setEndOption("date")}
                      className="mr-2"
                    />
                    {t("specific_date")}
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      name="endOption"
                      value="occurrences"
                      checked={endOption === "occurrences"}
                      onChange={() =>
                        setEndOption(
                          endOption === "occurrences" ? "date" : "occurrences"
                        )
                      }
                      className="mr-2 rounded-full"
                    />
                    {t("after")}
                    <input
                      type="number"
                      value={occurrences}
                      onChange={(e) => setOccurrences(e.target.value)}
                      className=" mr-2 ml-2 w-16 p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                      min="1"
                      disabled={endOption !== "occurrences"}
                    />
                    {t("occurrences")}
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="endOption"
                      value="never"
                      checked={endOption === "never"}
                      onChange={() => setEndOption("never")}
                      className="mr-2"
                    />
                    {t("never")}
                  </label>
                </div>
                {endOption === "date" && (
                  <DatePicker
                    selected={endDate ? new Date(endDate) : null}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    className="w-full p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                    locale={it}
                  />
                )}
              </div>
            )}
            {repeatType === "yearly" && (
              <div className="flex flex-col items-center gap-y-4">
                <label className="text-gray-600 dark:text-zinc-200">
                  {t("end_year")}
                </label>
                <div className="flex flex-col mt-10 md:mt-0 md:flex-row gap-x-8 gap-y-4 mb-10 md:mb-4">
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="endOption"
                      value="date"
                      checked={endOption === "date"}
                      onChange={() => setEndOption("date")}
                      className="mr-2"
                    />
                    {t("specific_date")}
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      name="endOption"
                      value="occurrences"
                      checked={endOption === "occurrences"}
                      onChange={() =>
                        setEndOption(
                          endOption === "occurrences" ? "date" : "occurrences"
                        )
                      }
                      className="mr-2 rounded-full"
                    />
                    {t("after")}
                    <input
                      type="number"
                      value={occurrences}
                      onChange={(e) => setOccurrences(e.target.value)}
                      className=" mr-2 ml-2 w-16 p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                      min="1"
                      disabled={endOption !== "occurrences"}
                    />
                    {t("occurrences")}
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="radio"
                      name="endOption"
                      value="never"
                      checked={endOption === "never"}
                      onChange={() => setEndOption("never")}
                      className="mr-2"
                    />
                    {t("never")}
                  </label>
                </div>
                {endOption === "date" && (
                  <DatePicker
                    showYearPicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy"
                    className="w-32 p-2 border rounded border-black dark:border-zinc-200 bg-gray-100 dark:bg-zinc-700 dark:text-white"
                    locale={it}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        <footer className="flex justify-end p-3 mt-5">
          <button
            onClick={handleSave}
            className="hover:bg-zinc-900 px-6 py-2 rounded-4xl mb-2 mr-4 text-white"
          >
            {t("save")}
          </button>
        </footer>
      </div>
    </div>
  );
}
