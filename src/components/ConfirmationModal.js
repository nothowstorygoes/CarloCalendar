import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { db, auth } from "../firebase";
import GlobalContext from "../context/GlobalContext";
import { doc, deleteDoc, collection, getDocs, query, where, writeBatch} from "firebase/firestore";

const ConfirmationModal = ({ label, setShowConfirmationModal, setLabels, labels }) => {
  const { t } = useTranslation();
  const { dispatchCalEvent} = useContext(GlobalContext);

  const handleDelete = async () => {
    try {
      // Delete the label document
      const labelRef = doc(db, `users/${auth.currentUser.uid}/labels`, label.id);
      await deleteDoc(labelRef);

      // Fetch and delete all events with the specified label
      const eventsRef = collection(db, `users/${auth.currentUser.uid}/events`);
      const q = query(eventsRef, where("label", "==", label.name));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        let event = doc.data();
        console.log("Deleting event:", event);
        dispatchCalEvent({ type: "delete", payload: event });
      });
      await batch.commit();

      // Update the labels state
      setLabels(labels.filter((lbl) => lbl.id !== label.id));
      setShowConfirmationModal(false);
    } catch (error) {
      console.error("Error deleting label and associated events:", error);
    }
  };

  const handleClose = () => {
    setShowConfirmationModal(false);
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-50 dark:bg-zinc-800 dark:bg-opacity-75">
      <div className="bg-white dark:bg-zinc-950 rounded-4xl shadow-2xl w-1/3 z-50">
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-4 flex justify-between items-center rounded-t-4xl">
          <h2 className="text-gray-600 dark:text-zinc-50 ml-4">Conferma cancellazione</h2>
          <button
            onClick={handleClose}
            className="material-icons-outlined text-gray-400 dark:text-zinc-200 mr-2"
          >
            close
          </button>
        </header>
        <div className="p-4">
          <p className="text-gray-600 dark:text-zinc-50">
            Sei sicuro di voler eliminare la categoria {label.name}?
          </p>
        </div>
        <footer className="flex justify-end p-3 py-6">
          <button
            onClick={handleClose}
            className="hover:bg-zinc-900 px-6 py-2 rounded-4xl text-white mr-4"
          >
            Cancella
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-4xl text-white mr-4"
          >
            {t("delete")}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;