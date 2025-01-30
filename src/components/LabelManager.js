import React, { useContext, useState, useRef } from "react";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { auth, db } from "../firebase";
import { addDoc, collection, doc, deleteDoc, updateDoc } from "firebase/firestore";
import LabelEditor from "./LabelEditor";
import ConfirmationModal from "./ConfirmationModal";
import { query, where, getDocs } from "firebase/firestore";

export const checkLabelNameUnique = async (name, calendarId) => {
  try {
    const labelsRef = collection(db, `users/${auth.currentUser.uid}/labels`);
    const q = query(labelsRef, where("name", "==", name), where("calendarId", "==", calendarId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return 1; // Name is unique
    } else {
      return 0; // Name is not unique
    }
  } catch (error) {
    console.error("Error checking label name uniqueness: ", error);
    return 0; // Default to not unique in case of error
  }
};

export default function LabelManager() {
  const { labels, setLabels, setViewMode, selectedLabel, setSelectedLabel, selectedCalendar } = useContext(GlobalContext);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelCode, setNewLabelCode] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#808080"); // Default to gray
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const { t } = useTranslation();
  const modalRef = useRef(null);

  const handleCreateLabel = async () => {
    const newLabel = {
      name: newLabelName,
      code: newLabelCode,
      color: newLabelColor,
      calendarId: selectedCalendar.id,
    };

    try {
      const isUnique = await checkLabelNameUnique(newLabelName, selectedCalendar.id);
      if (isUnique) {
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
      } else {
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error creating label:", error);
    }
  };

  const deleteLabel = (label) => {
    setSelectedLabel(label);
    setShowConfirmationModal(true);
  };

  const handleEditLabel = (label) => {
    setSelectedLabel(label);
    setShowLabelEditor(true);
  };

  const handleLabelClick = (label) => {
    setSelectedLabel(label);
    setViewMode("label");
  };

  const sortedLabels = [...labels]
    .filter((label) => label.calendarId === selectedCalendar.id)
    .sort((a, b) => a.code - b.code);

  console.log(sortedLabels);

  const usedCodes = sortedLabels.map((label) => label.code);

  return (
    <div className="h-[calc(100%-4rem)] w-[calc(100%-1.5rem)] left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950 rounded-3xl">
    <div
      ref={modalRef}
      className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-2rem)] max-w-none max-h-none overflow-hidden relative mt-8"
    >
        <div className="p-4 overflow-auto relative">
          <h2 className="text-lg font-bold mb-4 flex justify-center tracking-widest text-gray-600 dark:text-zinc-50">
            {t("manage_labels_for")} - {selectedCalendar.name}
          </h2>
          <div className="mb-8 flex justify-center">
            <input
              type="text"
              placeholder={t("add_label")}
              required
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="border p-2 rounded mr-4 w-64 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-50"
            />
            <select
              value={newLabelCode}
              required
              onChange={(e) => setNewLabelCode(e.target.value)}
              className="border p-2 rounded mr-4 w-64 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-50 custom-scrollbar"
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
              className="border p-5 rounded w-14 bg-gray-100 dark:bg-zinc-700 mr-4"
            />
            <button
              onClick={handleCreateLabel}
              className="bg-blue-500 text-white p-2 rounded ml-2 w-24"
            >
              {t("create")}
            </button>
          </div>
          {showAlert && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Errore: &nbsp;</strong>
              <span className="block sm:inline">Esiste gia' una categoria con questo nome!</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <button onClick={() => setShowAlert(false)}>
                  <span className="material-icons-outlined">close</span>
                </button>
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-6">
            {sortedLabels.map(({ id, name, code, color, calendarId }, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between mb-2 p-4 rounded"
                style={{ backgroundColor: `${color}` }} // Semi-transparent background
              >
                <span className="font-bold cursor-pointer" style={{ color: "#000" }} onClick={() => handleLabelClick({ id, name, code, color, calendarId })}>
                  {name} ({code})
                </span>
                <div>
                  <span
                    className="material-icons text-black ml-2 cursor-pointer mr-5"
                    onClick={() => handleEditLabel({ id, name, code, color, calendarId})}
                  >
                    edit
                  </span>
                  <button
                    onClick={() => deleteLabel({ id, name, code, color, calendarId })}
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