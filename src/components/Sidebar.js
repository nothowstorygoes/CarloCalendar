import React from "react";
import CreateEventButton from "./CreateEventButton";
import SmallCalendar from "./SmallCalendar";
import Labels from "./Labels";

export default function Sidebar() {
  return (
    <aside className="p-5 w-64 z-40 bg-white dark:bg-zinc-900">
      <CreateEventButton />
      <SmallCalendar />
      <hr className="mt-6 border-gray-200 dark:border-zinc-700"></hr>
      <Labels />
    </aside>
  );
}