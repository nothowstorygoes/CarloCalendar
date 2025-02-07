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
<div className="hidden md:flex md:p-4 md:rounded-3xl md:items-center md:shadow-md md:hover:shadow-2xl md:transition-shadow md:duration-300 md:dark:bg-zinc-700 md:dark:hover:bg-zinc-600 md:hover:transition md:duration-300 md:text-black md:dark:text-white md:font-bold">
      {formatTime(time)}
    </div>
  );
};

export default DigitalClock;