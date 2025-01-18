import React, { useState, useEffect } from "react";

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
  };

  return (
    <div       className=" p-4 rounded-3xl flex items-center shadow-md hover:shadow-2xl transition-shadow duration-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 hover:transition duration-300 text-black dark:text-white font-bold"
>
      {formatTime(time)}
    </div>
  );
};

export default DigitalClock;