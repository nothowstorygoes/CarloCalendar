import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { db, auth } from "../firebase";
import GlobalContext from "../context/GlobalContext";
import {
  doc,
  deleteDoc,
  collection,
  getDocs,
  query,
  getDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const ConfirmDelete = ({
  calendar,
  setShowConfirmationModal,
  setCalendars,
}) => {


  const handleDelete = async () => {
    try {
      console.log("Deleting calendar:", calendar);

      // Delete the calendar document
      const calendarsRef = collection(db, `users/${auth.currentUser.uid}/calendars`);
      const calendarQuery = query(calendarsRef, where("id", "==", calendar.id));
      const calendarSnapshot = await getDocs(calendarQuery);

      if (calendarSnapshot.empty) {
        console.log("No matching calendar document found!");
        return;
      }

      const calendarDoc = calendarSnapshot.docs[0];
      console.log("Calendar document fetched:", calendarDoc.data());

      // Delete the calendar document
      await deleteDoc(calendarDoc.ref);
      console.log("Calendar deleted:", calendar.id);


      // Fetch and delete all labels with the specified calendarId
      const labelsRef = collection(db, `users/${auth.currentUser.uid}/labels`);
      console.log("Labels collection reference created:", labelsRef);

      const labelsQuery = query(
        labelsRef,
        where("calendarId", "==", calendar.id)
      );
      console.log("Labels query created:", labelsQuery);

      const labelsSnapshot = await getDocs(labelsQuery);
      const batch = writeBatch(db);
      labelsSnapshot.forEach((labelDoc) => {
        batch.delete(labelDoc.ref);
      });
      await batch.commit();
      console.log("Labels deleted for calendar:", calendar.id);

      // Update the calendars in the global context
      setCalendars((prevCalendars) => prevCalendars.filter((cal) => cal.id !== calendar.id));
      setShowConfirmationModal(false);
    } catch (error) {
      console.error("Error deleting calendar:", error);
    }
  };

  const handleClose = () => {
    setShowConfirmationModal(false);
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-50 dark:bg-zinc-800 dark:bg-opacity-75">
      <div className="bg-white dark:bg-zinc-950 rounded-4xl shadow-2xl w-1/3 z-50">
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-4 flex justify-between items-center rounded-t-4xl">
          <h2 className="text-gray-600 dark:text-zinc-50 ml-4">
            Conferma cancellazione
          </h2>
          <button
            onClick={handleClose}
            className="material-icons-outlined text-gray-400 dark:text-zinc-200 mr-2"
          >
            close
          </button>
        </header>
        <div className="p-4">
          <p className="text-gray-600 dark:text-zinc-50">
            Sei sicuro di voler eliminare il calendario {calendar.name}? 
            <br />
            <br/>
            Cliccando "Elimina" cancellerai tutte le categorie e gli eventi associati a questo calendario.
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
            Cancella
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmDelete;
