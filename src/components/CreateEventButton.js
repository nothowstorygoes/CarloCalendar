import React, { useContext } from "react";
import plusImg from "../assets/plus.svg";
import GlobalContext from "../context/GlobalContext";

export default function CreateEventButton() {
  const { setShowEventModal } = useContext(GlobalContext);
  return (
    <button
      onClick={() => setShowEventModal(true)}
      className=" p-4 rounded-3xl flex items-center shadow-md hover:shadow-2xl transition-shadow duration-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 hover:transition duration-300"
    >
      <img src={plusImg} alt="create_event" className="w-7 h-7" />
      <span className="pl-3 pr-7 dark:text-zinc-50"> Crea</span>
    </button>
  );
}