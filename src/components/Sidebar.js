import React from "react";
import CreateEventButton from "./CreateEventButton";
import SmallCalendar from "./SmallCalendar";
import Labels from "./Labels";

export default function Sidebar() {
  return (
    <aside className="p-5 w-64 bg-white dark:bg-zinc-900">
      <CreateEventButton />
      <SmallCalendar />
      <hr className="mb-2 mt-2 border-gray-200 dark:border-zinc-700"></hr>
      <Labels />
    </aside>
  );
}