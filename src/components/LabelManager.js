import React, { useContext, useState } from "react";
import GlobalContext from "../context/GlobalContext";

export default function LabelManager() {
  const { labels, deleteLabel, createLabel, toggleLabelManager } = useContext(GlobalContext);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#808080"); // Default to gray

  const handleCreateLabel = () => {
    if (newLabelName.trim() !== "") {
      createLabel({ name: newLabelName, color: newLabelColor, checked: true });
      setNewLabelName("");
      setNewLabelColor("#808080"); // Reset to default gray
    }
  };

  const handleDeleteLabel = (labelName) => {
    deleteLabel(labelName);
  };

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
        <header className="bg-gray-100 px-4 py-2 flex items-center w-full">
          <button
            onClick={() => toggleLabelManager()}
            className="material-icons-outlined text-gray-400 ml-auto mr-9"
          >
            close
          </button>
        </header>
        <div className="p-4 overflow-auto relative">
          <h2 className="text-lg font-bold mb-4 flex justify-center tracking-widest">Manage Labels</h2>
          <div className="mb-8 flex justify-center">
            <input
              type="text"
              placeholder="Label name"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="border p-2 rounded mr-2 w-64"
            />
            <input
              type="color"
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
              className="border p-5 rounded w-14"
            />
            <button
              onClick={handleCreateLabel}
              className="bg-blue-500 text-white p-2 rounded ml-2 w-24"
            >
              Create
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {labels.map(({ name, color }, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between mb-2 p-4 rounded"
                style={{ backgroundColor: `${color}80` }} // Semi-transparent background
              >
                <span className="font-bold" style={{ color: '#ffff' }}>{name}</span>
                <button
                  onClick={() => handleDeleteLabel(name)}
                  className="material-icons-outlined cursor-pointer"
                  style={{ color: '#ffff' }} // Set contrast color
                >
                  delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}