import React from "react";
import CreateEventButton from "./CreateEventButton";
import SmallCalendar from "./SmallCalendar";
import Calendars from "./Calendars";
import DigitalClock from "./DigitalClock";

export default function Sidebar() {
  return (
<aside className="!hidden md:!block p-5 w-72 bg-white dark:bg-zinc-900">
<div className="flex items-center justify-center md:justify-between">
    <CreateEventButton />
    &nbsp;&nbsp;
    <DigitalClock />
  </div>
  <SmallCalendar />
  <hr className="mb-2 mt-2 border-gray-200 dark:border-zinc-700"></hr>
  <Calendars />
</aside>

  );
}
