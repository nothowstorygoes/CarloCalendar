import React, { useContext, useEffect, useState } from "react";
import { doc, getDoc, updateDoc, writeBatch, collection, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Spinner from "../assets/spinner";
import dayjs from "dayjs";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function Backup() {
  const { t } = useTranslation();
  const { user, viewMode, setViewMode } = useContext(GlobalContext);
  const [backupInfo, setBackupInfo] = useState(null);
  const [creating, setCreating] = useState(false);
  const [backupTriggered, setBackupTriggered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBackupInfo = async () => {
      if (user) {
        console.log("Fetching backup info for user:", user);
        const backupsCollectionRef = collection(db, `users/${user.uid}/backup`);
        try {
          const backupsSnapshot = await getDocs(backupsCollectionRef);
          console.log("Backups snapshot:", backupsSnapshot.docs);
          if (backupsSnapshot.docs.length > 0) {
            const backupFolders = backupsSnapshot.docs.map((doc) => doc.id);
            console.log("Backup folders found:", backupFolders);
            setBackupInfo(backupFolders);
          } else {
            setBackupInfo("empty");
            console.error("Backup document does not exist");
          }
        } catch (error) {
          console.error("Error fetching backup document:", error);
        }
      } else {
        console.error("User is not defined or does not have a UID");
      }
    };

    fetchBackupInfo();
  }, [user, backupTriggered]);

  const handleRollback = async (backup) => {
    console.log("Rolling back to backup:", backup);
    if (!user) {
      console.error("User is not defined or does not have a UID");
      return;
    }

    try {
      const backupsCollectionRef = collection(db, `users/${user.uid}/backup`);
      const backupsSnapshot = await getDocs(backupsCollectionRef);
      const tempArray = backupsSnapshot.docs.map(doc => ({
        id: doc.id,
        created: doc.data().created
      }));

      const backupDate = backup.substring(0, 10);
      const matchedBackup = tempArray.find(item => item.created.startsWith(backupDate));

      if (!matchedBackup) {
        console.error("No matching backup folder found");
        return;
      }

      const backupFolderRef = doc(db, `users/${user.uid}/backup`, matchedBackup.id);

      const eventsCollectionRef = collection(db, `users/${user.uid}/events`);
      const eventsSnapshot = await getDocs(eventsCollectionRef);
      const labelsCollectionRef = collection(db, `users/${user.uid}/labels`);
      const labelsSnapshot = await getDocs(labelsCollectionRef);

      const batch = writeBatch(db);

      eventsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      labelsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      const backupEventsCollectionRef = collection(backupFolderRef, "events");
      const backupEventsSnapshot = await getDocs(backupEventsCollectionRef);
      const backupLabelsCollectionRef = collection(backupFolderRef, "labels");
      const backupLabelsSnapshot = await getDocs(backupLabelsCollectionRef);

      const restoreBatch = writeBatch(db);

      backupEventsSnapshot.forEach((backupDoc) => {
        const eventRef = doc(db, `users/${user.uid}/events`, backupDoc.id);
        restoreBatch.set(eventRef, backupDoc.data());
      });

      backupLabelsSnapshot.forEach((backupDoc) => {
        const labelRef = doc(db, `users/${user.uid}/labels`, backupDoc.id);
        restoreBatch.set(labelRef, backupDoc.data());
      });

      await restoreBatch.commit();

      console.log("Rollback completed successfully");
    } catch (error) {
      console.error("Error during rollback:", error);
    }
  };

  const handleDeleteBackup = async (backup) => {
    console.log("Deleting backup:", backup);
    if (!user) {
      console.error("User is not defined or does not have a UID");
      return;
    }

    try {
      const backupsCollectionRef = collection(db, `users/${user.uid}/backup`);
      const backupsSnapshot = await getDocs(backupsCollectionRef);
      const tempArray = backupsSnapshot.docs.map(doc => ({
        id: doc.id,
        created: doc.data().created
      }));

      const backupDate = backup.substring(0, 10);
      const matchedBackup = tempArray.find(item => item.created.startsWith(backupDate));

      if (!matchedBackup) {
        console.error("No matching backup folder found");
        return;
      }

      const backupFolderRef = doc(db, `users/${user.uid}/backup`, matchedBackup.id);

      const batch = writeBatch(db);

      const backupEventsCollectionRef = collection(backupFolderRef, "events");
      const backupEventsSnapshot = await getDocs(backupEventsCollectionRef);
      backupEventsSnapshot.forEach((backupDoc) => {
        batch.delete(backupDoc.ref);
      });

      const backupLabelsCollectionRef = collection(backupFolderRef, "labels");
      const backupLabelsSnapshot = await getDocs(backupLabelsCollectionRef);
      backupLabelsSnapshot.forEach((backupDoc) => {
        batch.delete(backupDoc.ref);
      });

      batch.delete(backupFolderRef);

      await batch.commit();

      console.log("Backup deleted successfully");
      setBackupTriggered(true);
    } catch (error) {
      console.error("Error deleting backup:", error);
    }
    setBackupTriggered(!backupTriggered);
  };

  const handleCreateBackup = async () => {
    console.log("Creating backup...");
    setCreating(true);
    if (!user) {
      console.error("User is not defined or does not have a UID");
      return;
    }

    try {
      const eventsSnapshot = await getDocs(
        collection(db, `users/${auth.currentUser.uid}/events`)
      );
      const events = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const labelsSnapshot = await getDocs(
        collection(db, `users/${auth.currentUser.uid}/labels`)
      );
      const labels = labelsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const calendarsSnapshots = await getDocs(
        collection(db, `users/${auth.currentUser.uid}/calendars`)
      );

      const calendars = calendarsSnapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const today = dayjs().format("YYYY-MM-DD");
      const backupFolderRef = doc(
        db,
        `users/${auth.currentUser.uid}/backup`,
        today
      );

      const eventsBackupRef = collection(backupFolderRef, "events");
      for (const event of events) {
        await setDoc(doc(eventsBackupRef, event.id), event);
      }

      await setDoc(backupFolderRef, { created: dayjs().toISOString() });

      const labelsBackupRef = collection(backupFolderRef, "labels");
      for (const label of labels) {
        await setDoc(doc(labelsBackupRef, label.id), label);
      }

      const calendarsBackupRef = collection(backupFolderRef, "calendars");
      for (const calendar of calendars) {
        await setDoc(doc(calendarsBackupRef, calendar.id), calendar);
      }


      console.log("Backup created successfully");
      setBackupTriggered(!backupTriggered);
    } catch (error) {
      console.error("Error creating backup:", error);
    }
    setCreating(false);
  };

  const handleDownloadBackup = async () => {
    if (!user) {
      console.error("User is not defined or does not have a UID");
      return;
    }

    const zip = new JSZip();

    try {
      const eventsSnapshot = await getDocs(
        collection(db, `users/${auth.currentUser.uid}/events`)
      );
      const events = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const labelsSnapshot = await getDocs(
        collection(db, `users/${auth.currentUser.uid}/labels`)
      );
      const labels = labelsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const calendarsSnapshots = await getDocs(
        collection(db, `users/${auth.currentUser.uid}/calendars`)
      );

      const calendars = calendarsSnapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      zip.file('events.json', JSON.stringify(events));
      zip.file('labels.json', JSON.stringify(labels));
      zip.file('calendars.json', JSON.stringify(calendars));

      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'backup.zip');
      });

      console.log("Backup downloaded successfully");
    } catch (error) {
      console.error("Error downloading backup:", error);
    }
  };

  if (!backupInfo) {
    return (
      <div className="h-[calc(100%-4rem)] w-[calc(100%-1.5rem)] left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950 rounded-3xl">
        <div className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative mt-8 justify-center flex items-center">
          <div>
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100%-4rem)] w-[calc(100%-1.5rem)] left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950 rounded-3xl">
      <div className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative mt-8">
        <div className="p-4 relative w-full">
          <div className="flex justify-between overflow-x-hidden custom-scrollbar">
            <div className="flex flex-col items-center w-full">
              <div className="flex items-center w-full mb-20">
                <p className="text-2xl font-bold text-gray-600 dark:text-zinc-50">
                  I tuoi backup
                </p>
                <button
                  onClick={handleCreateBackup}
                  className=" ml-52 mr-12 bg-blue-500 hover:bg-blue-600 text-white font-bold text-3xl px-2 rounded-4xl"
                >
                  +
                </button>
                {creating && (
                  <div role="status">
                    <svg
                      aria-hidden="true"
                      className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span className="sr-only">Loading...</span>
                  </div>
                )}
              </div>
              {backupInfo === "empty" && (
                <p className="text-gray-500 dark:text-zinc-50">
                  Non sono presenti backup. Clicca sul pulsante per crearne
                  uno.
                </p>
              )}
              {backupInfo !== "empty" &&
                backupInfo.map((backup, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between w-full mb-4 bg-gray-100 dark:bg-zinc-800 p-4 rounded-3xl"
                  >
                    <p className="text-lg text-gray-600 dark:text-zinc-50">
                      {backup}
                    </p>
                    <div className="flex items-center">
                    <button
                  onClick={handleDownloadBackup}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-2 py-1 rounded-4xl material-icons mr-4"
                >
                  download
                </button>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-4xl w-24" onClick={() => handleRollback(backup)}>
                        Ripristina
                      </button>
                      <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-2 rounded-4xl flex items-center justify-center ml-4" onClick={() => handleDeleteBackup(backup)}>
                        <span className="material-icons-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
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