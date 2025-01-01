import React, { useContext, useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import imageCompression from 'browser-image-compression';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useContext(GlobalContext);
  const [userInfo, setUserInfo] = useState(null);
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
              <button
                onClick={handleSignOut}
                className="mt-8 bg-red-500 hover:bg-red-600 text-white p-2 rounded-4xl w-40"
              >
                {t("sign_out")}
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