import React, { useContext } from "react";
import GlobalContext from "../context/GlobalContext";

export default function LabelManager() {
  const { toggleLabelManager} = useContext(GlobalContext);

  const handleClickOutside = (event) => {
    if (event.target.id === "label-manager-overlay") {
      toggleLabelManager(false);
    }
  };

  return (
    <div
      id="label-manager-overlay"
      className="fixed top-0 left-0 w-full h-full flex justify-center items-center z-50"
      onClick={handleClickOutside}
    >
      <div className="bg-white w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative ml-64 mt-16">
      <header className="bg-gray-100 px-4 py-2 flex justify-between items-center rounded-t-lg">
          <span className="material-icons-outlined text-gray-400">
            drag_handle
          </span>
          <button
            onClick={() => toggleLabelManager()}
            className="material-icons-outlined text-gray-400"
          >
            close
          </button>
        </header>
        <div className="p-4 overflow-auto relative">
          {/* Your LabelManager content goes here */}
        </div>
      </div>
    </div>
  );
}