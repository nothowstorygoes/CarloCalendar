import React, { useContext } from "react";
import plusImg from "../assets/plus.svg";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";

export default function CreateEventButton() {
  const { setShowEventModal } = useContext(GlobalContext);
  const { t } = useTranslation();
  return (
    <button
      onClick={() => setShowEventModal(true)}
      className="p-6 md:p-4 rounded-3xl flex items-center shadow-md hover:shadow-2xl transition-shadow duration-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 hover:transition duration-300"
    >
      <img src={plusImg} alt="create_event" className="w-9 h-9 md:w-7 md:h-7" />
      <span className="pl-5 pr-9 md:pl-3 md:pr-7 dark:text-zinc-50">
        {t("create")}
      </span>
    </button>
  );
}
