import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalContext from "../context/GlobalContext";
import { db, auth } from "../firebase";
import { checkLabelNameUnique } from "./LabelManager";
import {
  doc,
  updateDoc,
  collection,
  where,
  query,
  getDocs,
  writeBatch,
} from "firebase/firestore";

export default function LabelEditor({ selectedLabel, setShowLabelEditor }) {
  const { t } = useTranslation();
  const { labels, setLabels, dispatchCalEvent } = useContext(GlobalContext);
  const [name, setName] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [code, setCode] = useState("");
  const [color, setColor] = useState("#808080"); // Default to gray

  useEffect(() => {
    if (selectedLabel) {
      setName(selectedLabel.name);
      setCode(selectedLabel.code);
      setColor(selectedLabel.color);
    }
  }, [selectedLabel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedLabel = {
      name,
      code,
      color,
    };

    try {
      const isUnique = await checkLabelNameUnique(name, selectedLabel.id);
      if (isUnique || selectedLabel.name === name) {
        const labelRef = doc(
          db,
          `users/${auth.currentUser.uid}/labels`,
          selectedLabel.id
        );
        await updateDoc(labelRef, updatedLabel);

        // Check if the label name has changed
        if (selectedLabel.name !== name) {
          // Fetch all events with the old label name
          const eventsRef = collection(
            db,
            `users/${auth.currentUser.uid}/events`
          );
          const q = query(eventsRef, where("label", "==", selectedLabel.name));
          const querySnapshot = await getDocs(q);

          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => {
            const eventRef = doc.ref;
            const updatedEvent = { ...doc.data(), label: name };
            batch.update(eventRef, updatedEvent);
            dispatchCalEvent({type: "update", payload: updatedEvent});
          });
          await batch.commit();
        }

        setLabels(
          labels.map((lbl) =>
            lbl.id === selectedLabel.id ? { ...lbl, ...updatedLabel } : lbl
          )
        );
        setShowLabelEditor(false);
      } else {
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error updating label: ", error);
    }
  };

  const handleClose = () => {
    setShowLabelEditor(false);
  };

  const usedCodes = labels.map((label) => label.code);

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-40 dark:bg-zinc-800 dark:bg-opacity-75">
      <form
        className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl w-1/3 z-50"
        onSubmit={handleSubmit}
      >
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center rounded-t-lg">
          <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
            drag_handle
          </span>
          <button
            onClick={handleClose}
            className="material-icons-outlined text-gray-400 dark:text-zinc-200"
          >
            close
          </button>
        </header>
        <div className="p-3">
          <div className="flex flex-col gap-y-6">
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                label
              </span>
              <input
                type="text"
                name="name"
                placeholder={t("label_name")}
                value={name}
                required
                className="ml-4 pt-3 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold pb-2 w-40 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex items-center relative">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                code
              </span>
              <select
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="ml-4 border p-2 rounded w-40 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-50 custom-scrollbar"
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
            </div>
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                color_lens
              </span>
              <input
                type="color"
                name="color"
                value={color}
                required
                className="ml-4 pt-3 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold pb-2 w-20 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
        </div>
        <footer className="flex justify-end border-t p-3 mt-5">
          {showAlert && (
            <div className=" text-sm text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Esiste gia' una categoria con lo stesso nome!</strong>
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded text-white"
          >
            {t("save")}
          </button>
        </footer>
      </form>
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
