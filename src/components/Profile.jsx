import React, { useContext, useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import dayjs from "dayjs";
import { format } from "date-fns";
import imageCompression from 'browser-image-compression';

export default function Profile() {
  const { t } = useTranslation();
  const { user, viewMode, setViewMode, savedEvents} = useContext(GlobalContext);
  const [userInfo, setUserInfo] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  console.log("Saved events:", savedEvents);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user) {
        console.log("Fetching user info for user:", user);
        const userDoc = doc(db, `users/${user.uid}/info`, user.email);
        try {
          const userSnapshot = await getDoc(userDoc);
          if (userSnapshot.exists()) {
            console.log("User document found:", userSnapshot.data());
            setUserInfo(userSnapshot.data());
            let propic = userInfo.profilePicture;
            localStorage.setItem("propic", propic);
          } else {
            console.error("User document does not exist");
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
        }
      } else {
        console.error("User is not defined or does not have a UID");
      }
    };

    fetchUserInfo();
  }, [user]);

  const handleDownloadAllPDF = async () => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    console.log("Saved events:", savedEvents);
  
    const labels = await getLabels(); // Fetch labels to get colors
  
    const filteredEvents = savedEvents
    .filter((event) => {
      const eventDate = dayjs(event.day);
      return eventDate.isAfter(start) && eventDate.isBefore(end) && !event.checked;
    })
    .map((event) => {
      const label = labels.find((lbl) => lbl.name === event.label);
      return { ...event, labelCode: label ? label.code : 0, labelColor: label ? label.color : "#000000" };
    })
    .sort((a, b) => {
      if (a.labelCode !== b.labelCode) {
        return a.labelCode - b.labelCode; // Sort by label code
      }
      return dayjs(a.day).diff(dayjs(b.day)); // Sort by date within each label code
    });
  
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Eventi dal ${format(start.toDate(), "dd/MM/yyyy")} al ${format(end.toDate(), "dd/MM/yyyy")}`, 105, 10, null, null, "center");
  
    let yOffset = 20;
  
    filteredEvents.forEach((event, index) => {
      const eventDate = format(dayjs(event.day).toDate(), "dd/MM/yyyy");
  
      // Check if we need to add a new page
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
  
      // Draw event rectangle with background color and rounded corners
    // Draw a dot with the label color
    doc.setFillColor(event.labelColor);
    doc.circle(20, yOffset + 8, 2, "F");

  
      // Add event title in bold
      doc.setFont("helvetica", "bold");
      const truncatedName = event.title.length > 45 ? event.title.substring(0, 45) + "..." : event.title;

      if (event.description) {
        doc.text(`${truncatedName}`, 25, yOffset + 7);
      } else {
        doc.text(`${truncatedName}`, 25, yOffset + 8); // Center vertically if no description
      }
  
      // Add event description if it exists
      doc.setFont("helvetica", "normal");
      if (event.description) {
        const truncatedDescription = event.description.length > 45 ? event.description.substring(0, 45) + "..." : event.description;
        doc.text(`Descrizione: ${truncatedDescription}`, 25, yOffset + 12);
      }
  
      // Add event label name
      if(event.description){
        doc.text(`Categoria: ${event.label}`, 25, yOffset + 17);
      }
      else{
        doc.text(`Categoria: ${event.label}`, 25, yOffset + 15);
      }
  
      // Add event time if it exists
      if (event.time) {
        doc.text(`Ora: ${event.time}`, 150, yOffset + 14);
      }
  
      // Add event date
      doc.text(`Data: ${eventDate}`, 150, yOffset + 9);
  
      yOffset += 20; // Adjusted height
    });
  
    doc.save("eventi.pdf");
  };
  
  
  const handleDownloadByDayPDF = async () => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    console.log("Saved events:", savedEvents);
  
    const labels = await getLabels(); // Fetch labels to get colors
  
    const filteredEvents = savedEvents
    .filter((event) => {
      const eventDate = dayjs(event.day);
      return eventDate.isAfter(start) && eventDate.isBefore(end) && !event.checked;
    })
    .map((event) => {
      const label = labels.find((lbl) => lbl.name === event.label);
      return { ...event, labelCode: label ? label.code : 0, labelColor: label ? label.color : "#000000" };
    })
    .sort((a, b) => {
      if (a.labelCode !== b.labelCode) {
        return a.labelCode - b.labelCode; // Sort by label code
      }
      return dayjs(a.day).diff(dayjs(b.day)); // Sort by date within each label code
    });
  
    const doc = new jsPDF();
    doc.setFontSize(12);
  
    let currentDay = null;
    let yOffset = 20;
  
    filteredEvents.forEach((event, index) => {
      const eventDate = format(dayjs(event.day).toDate(), "dd/MM/yyyy");
  
      if (currentDay !== eventDate) {
        currentDay = eventDate;
        yOffset += 5;
        doc.text(`Data: ${eventDate}`, 105, yOffset, null, null, "center");
        yOffset += 10;
      }
  
      // Draw event rectangle with background color and rounded corners
    // Draw a dot with the label color
    doc.setFillColor(event.labelColor);
    doc.circle(20, yOffset + 8, 2, "F");

  
      // Add event title in bold
      doc.setFont("helvetica", "bold");
      if (event.description) {
        doc.text(`${event.title}`, 25, yOffset + 7);
      } else {
        doc.text(`${event.title}`, 25, yOffset + 8); // Center vertically if no description
      }
  
      // Add event description if it exists
      doc.setFont("helvetica", "normal");
      if (event.description) {
        const truncatedDescription = event.description.length > 50 ? event.description.substring(0, 50) + "..." : event.description;
        doc.text(`Descrizione: ${truncatedDescription}`, 25, yOffset + 12);
      }
  
      // Add event label name
      
      if(event.description)
      {
        doc.text(`Categoria: ${event.label}`, 25, yOffset + 17);
      }
      else{
        doc.text(`Categoria: ${event.label}`, 25, yOffset + 15);
      }
  
      // Add event time if it exists
      if (event.time) {
        doc.text(`Ora: ${event.time}`, 160, yOffset + 15);
      }
  
      yOffset += 20; // Adjusted height
  
      // Check if we need to add a new page
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
    });
  
    doc.save("eventi_per_giorno.pdf");
  };
  
  const getLabels = async () => {
    const labelsRef = collection(db, `users/${auth.currentUser.uid}/labels`);
    const labelsSnapshot = await getDocs(labelsRef);
    return labelsSnapshot.docs.map((doc) => doc.data());
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result.replace("data:", "").replace(/^.+,/, "");
          localStorage.setItem("propic", base64String);

          if (user && user.email) {
            const userDoc = doc(db, `users/${user.uid}/info`, user.email);
            await updateDoc(userDoc, { profilePicture: base64String });
            setUserInfo((prevInfo) => ({ ...prevInfo, profilePicture: base64String }));
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Error compressing image:", error);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (!userInfo) {
    return (
      <div className="h-[calc(100%-4rem)] w-[calc(100%-1.5rem)] left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950 rounded-3xl">
        <div className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative mt-8 justify-center flex items-center">
          <p className="text-gray-500 dark:text-zinc-50 text-sm">
            {t("loading_user_info")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100%-4rem)] w-[calc(100%-1.5rem)] left-0 top-0 flex justify-center items-center bg-white dark:bg-zinc-950 rounded-3xl">
      <div className="bg-white dark:bg-zinc-950 w-[calc(100%-16rem)] h-[calc(100%-4rem)] max-w-none max-h-none overflow-hidden relative mt-8">
        <div className="p-4 relative w-full">
          <div className="flex justify-between overflow-x-hidden custom-scrollbar">
            <div className="flex flex-col items-start">
              <p className="text-2xl font-bold text-gray-600 dark:text-zinc-50 mb-20">
                Ciao, {userInfo.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-zinc-50">
                Email:  <b>{userInfo.email}</b>
              </p>
              <div className="flex justify-between items-center mt-12">
              <p className="text-white mr-5 text-sm">Scegli un'immagine come avatar:</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
              />
              </div>
              <div className="flex justify-between items-center mt-12">
                <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-4xl w-40" onClick={() => setViewMode("backup")}>
                  I tuoi backup
                </button>
              
              <button
                onClick={handleSignOut}
                className="bg-red-500 ml-14 hover:bg-red-600 text-white p-2 rounded-4xl w-40"
              >
                {t("sign_out")}
              </button>
              </div>
            </div>
            <div className="flex flex-col mt-12">
                <label className="text-gray-600 dark:text-zinc-50">Inzio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-50 p-2 rounded"
                />
                <label className="text-gray-600 dark:text-zinc-50 mt-4">Fine</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-50 p-2 rounded"
                />
                <button
                  onClick={handleDownloadAllPDF}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-4xl w-40 mt-4"
                >
                  Stampa Tutti
                </button>
                <button
                  onClick={handleDownloadByDayPDF}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-4xl w-40 mt-4"
                >
                  Stampa per Giorno
                </button>
              </div>
            <div className="flex items-center justify-center">
              <img
                src={`data:image/png;base64,${userInfo.profilePicture}`}
                alt="Profile"
                className="w-40 h-40 rounded-full mb-4 object-cover"
              />
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