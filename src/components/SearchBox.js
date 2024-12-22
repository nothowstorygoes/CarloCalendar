import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import dayjs from "dayjs";

const SearchBox = ({ setShowSearchBox, handleEventClick }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchBoxRef = useRef(null);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const handleSearch = debounce(async (term) => {
    if (term.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const eventsRef = collection(db, `users/${auth.currentUser.uid}/events`);
    const q = query(eventsRef, where("title", ">=", term), where("title", "<=", term + "\uf8ff"));
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const sortedEvents = events.sort((a, b) => a.checked - b.checked);
    setSearchResults(sortedEvents);
    setIsSearching(false);
  }, 2000);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    handleSearch(e.target.value);
  };

  const handleClickOutside = (event) => {
    if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
      setShowSearchBox(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-14 z-50 bg-white dark:bg-zinc-900 flex items-center justify-center">
      <div ref={searchBoxRef} className="relative w-full max-w-4xl mx-auto p-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={t("search")}
          className="border mt-1 rounded-3xl py-2 px-4 pl-10 w-full bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-50"
        />
        <span className="absolute ml-4 mt-1 left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-zinc-50">
          <i className="material-icons">search</i>
        </span>
        {isSearching && (
          <div className="absolute top-full left-0 w-full bg-white dark:bg-zinc-900 p-4 rounded shadow-lg">
            <p className="text-gray-500 dark:text-zinc-50">{t("searching")}...</p>
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="absolute top-full -mt-1 left-0 w-full bg-white dark:bg-zinc-900 p-4 rounded shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
            <ul>
              {searchResults.slice(0, 3).map((event, index) => (
                <li
                  key={index}
                  className="text-gray-800 dark:text-zinc-50 cursor-pointer mb-2 mt-2 bg-gray-200 dark:bg-zinc-700 p-2 rounded-xl"
                  onClick={() => handleEventClick(event)}
                > 
                  <p className="font-bold">{event.title}</p>
                  {dayjs(event.day).format("DD/MM/YYYY")} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {event.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
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
};

export default SearchBox;