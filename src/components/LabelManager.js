import React, { useContext, useState, useRef } from "react";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { auth, db } from "../firebase";
import { addDoc, collection, doc, deleteDoc } from "firebase/firestore";
import LabelEditor from "./LabelEditor";
import ConfirmationModal from "./ConfirmationModal";

export default function LabelManager() {
  const { labels, setLabels, setViewMode } = useContext(GlobalContext);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelCode, setNewLabelCode] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#808080"); // Default to gray
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const { t } = useTranslation();
  const modalRef = useRef(null);

  const handleCreateLabel = async () => {
    const newLabel = {
      name: newLabelName,
      code: newLabelCode,
      color: newLabelColor,
    };

    try {
      console.log("Creating label:", newLabel);
      const labelRef = await addDoc(
        collection(db, `users/${auth.currentUser.uid}/labels`),
        newLabel
      );
      console.log("Label created with ID:", labelRef.id);
      setLabels([...labels, { id: labelRef.id, ...newLabel }]);
      setNewLabelName("");
      setNewLabelCode("");
      setNewLabelColor("#808080"); // Reset to default gray
    } catch (error) {
      console.error("Error creating label:", error);
    }
  };

  const deleteLabel = (label) => {
    setSelectedLabel(label);
    setShowConfirmationModal(true);
  };

  const handleClickOutside = (event) => {
    if (event.target.id === "label-manager-overlay") {
      setViewMode("month");
    }
  };

  const handleEditLabel = (label) => {
    setSelectedLabel(label);
    setShowLabelEditor(true);
  };

  const sortedLabels = [...labels].sort((a, b) => a.code - b.code);
  const usedCodes = labels.map((label) => label.code);

  return (
    <div
      id="label-manager-overlay"
      className="fixed top-0 left-0 w-full h-full flex justify-center items-center z-50 dark:bg-zinc-950 dark:bg-opacity-0"
      onClick={handleClickOutside}
      style={{
        "--scrollbar-track-bg": document.documentElement.classList.contains(
          "dark"
        )
          ? "#3f3f46"
          : "#e5e7eb",
      }}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-5.5rem)] max-w-none max-h-none overflow-hidden relative ml-64 mt-16 rounded-3xl mr-5 mb-8"
      >
        <button
          onClick={() => setViewMode("day")}
          className="material-icons-outlined text-gray-400 dark:text-zinc-50 ml-14 mt-8 flex flex-end"
        >
          close
        </button>
        <div className="p-4 overflow-auto relative">
          <h2 className="text-lg font-bold mb-4 flex justify-center tracking-widest text-gray-600 dark:text-zinc-50">
            {t("manage_labels")}
          </h2>
          <div className="mb-8 flex justify-center">
            <input
              type="text"
              placeholder={t("add_label")}
              required
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="border p-2 rounded mr-2 w-64 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-50"
            />
            <select
              value={newLabelCode}
              required
              onChange={(e) => setNewLabelCode(e.target.value)}
              className="border p-2 rounded mr-2 w-64 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-50 custom-scrollbar"
            >
              <option value="" disabled>
                {t("select_priority")}
              </option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((code) => (
                <option
                  key={code}
                  value={code}
                  disabled={usedCodes.includes(code.toString())}
                  className={
                    usedCodes.includes(code.toString())
                      ? "text-gray-600 dark:text-zinc-50"
                      : ""
                  }
                >
                  {code}
                </option>
              ))}
            </select>
            <input
              type="color"
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
              className="border p-5 rounded w-14 bg-gray-100 dark:bg-zinc-700"
            />
            <button
              onClick={handleCreateLabel}
              className="bg-blue-500 text-white p-2 rounded ml-2 w-24"
            >
              {t("create")}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {sortedLabels.map(({ id, name, code, color }, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between mb-2 p-4 rounded"
                style={{ backgroundColor: `${color}` }} // Semi-transparent background
              >
                <span className="font-bold" style={{ color: "#000" }}>
                  {name} ({code})
                </span>
                <div>
                  <span
                    className="material-icons text-black ml-2 cursor-pointer mr-5"
                    onClick={() => handleEditLabel({ id, name, code, color })}
                  >
                    edit
                  </span>
                  <button
                    onClick={() => deleteLabel({ id, name, code, color })}
                    className="material-icons-outlined cursor-pointer"
                    style={{ color: "#000" }} // Set contrast color
                  >
                    delete
                  </button>
                </div>
              </div>
            ))}
            {showLabelEditor && (
              <LabelEditor
                selectedLabel={selectedLabel}
                setShowLabelEditor={setShowLabelEditor}
              />
            )}
          </div>
        </div>
      </div>
      {showConfirmationModal && (
        <ConfirmationModal
          label={selectedLabel}
          setShowConfirmationModal={setShowConfirmationModal}
          setLabels={setLabels}
          labels={labels}
        />
      )}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--scrollbar-track-bg);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}