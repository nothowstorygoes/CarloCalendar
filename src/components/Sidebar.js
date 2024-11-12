import React from "react";
import CreateEventButton from "./CreateEventButton";
import SmallCalendar from "./SmallCalendar";
import Labels from "./Labels";
export default function Sidebar() {
  return (
    <aside className="border p-5 w-64 z-40">
      <CreateEventButton />
      <SmallCalendar />
      <hr className="mt-6"></hr>
      <Labels />
    </aside>
  );
}
