import React, { useContext, useState } from "react";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { auth, db } from "../firebase";
import { addDoc, collection, doc, deleteDoc } from "firebase/firestore";
import LabelEditor from "./LabelEditor";

export default function LabelManager() {
  const { labels, setLabels, setViewMode } = useContext(GlobalContext);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelCode, setNewLabelCode] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#808080"); // Default to gray
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const { t } = useTranslation();

  const handleCreateLabel = async () => {
    console.log("Label Name:", newLabelName);
    console.log("Label Code:", newLabelCode);
    console.log("Label Color:", newLabelColor);
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

  const deleteLabel = async (labelId) => {
    try {
      const labelRef = doc(db, `users/${auth.currentUser.uid}/labels`, labelId);
      await deleteDoc(labelRef);
      setLabels(labels.filter((lbl) => lbl.id !== labelId));
    } catch (error) {
      console.error("Error deleting label:", error);
    }
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

  const sortedLabels = [...labels].sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div
      id="label-manager-overlay"
      className="fixed top-0 left-0 w-full h-full flex justify-center items-center z-50 dark:bg-zinc-950 dark:bg-opacity-0"
      onClick={handleClickOutside}
    >
      <div className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-5.5rem)] max-w-none max-h-none overflow-hidden relative ml-64 mt-16 rounded-3xl mr-5 mb-8">
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
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="border p-2 rounded mr-2 w-64 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-zinc-50"
            />
            <input
              type="text"
              placeholder={t("add_code")}
              value={newLabelCode}
              onChange={(e) => setNewLabelCode(e.target.value)}
              className="border p-2 rounded mr-2 w-20 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-zinc-50"
              maxLength={3}
            />
            <input
              type="color"
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
              className="border p-5 rounded w-14 bg-gray-100 dark:bg-gray-700"
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
                style={{ backgroundColor: `${color}80` }} // Semi-transparent background
              >
                <span className="font-bold" style={{ color: "#ffff" }}>
                  {name} ({code})
                </span>
                <div>
                <span
                  className="material-icons text-white ml-2 cursor-pointer mr-5"
                  onClick={() => handleEditLabel({ id, name, code, color })}
                >
                  edit
                </span>
                <button
                  onClick={() => deleteLabel(id)}
                  className="material-icons-outlined cursor-pointer"
                  style={{ color: "#ffff" }} // Set contrast color
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
    </div>
  );
}
