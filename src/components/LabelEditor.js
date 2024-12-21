import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import GlobalContext from "../context/GlobalContext";
import { db, auth } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function LabelEditor({ selectedLabel, setShowLabelEditor }) {
  const { t } = useTranslation();
  const { labels, setLabels } = useContext(GlobalContext);
  const [name, setName] = useState("");
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
      const labelRef = doc(db, `users/${auth.currentUser.uid}/labels`, selectedLabel.id);
      await updateDoc(labelRef, updatedLabel);
      setLabels(labels.map(lbl => lbl.id === selectedLabel.id ? { ...lbl, ...updatedLabel } : lbl));
      setShowLabelEditor(false);
    } catch (error) {
      console.error("Error updating label: ", error);
    }
  };

  const handleClose = () => {
    setShowLabelEditor(false);
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-40 dark:bg-zinc-800 dark:bg-opacity-75">
      <form className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl w-1/3 z-50" onSubmit={handleSubmit}>
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
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                label
              </span>
              <input
                type="text"
                name="name"
                placeholder={t('label_name')}
                value={name}
                required
                className="ml-6 pt-3 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold pb-2 w-60 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                code
              </span>
              <input
                type="text"
                name="code"
                placeholder={t('label_code')}
                value={code}
                required
                maxLength={3}
                className="ml-6 pt-3 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold pb-2 w-20 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                onChange={(e) => setCode(e.target.value)}
              />
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
                className="ml-6 pt-3 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold pb-2 w-20 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 mb-4 bg-gray-100 dark:bg-zinc-700 rounded"
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
        </div>
        <footer className="flex justify-end border-t p-3 mt-5">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded text-white"
          >
            {t('save')}
          </button>
        </footer>
      </form>
    </div>
  );
}