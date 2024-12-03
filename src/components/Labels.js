import React, { useContext, useState } from "react";
import GlobalContext from "../context/GlobalContext";
import LabelEventsModal from "./LabelEventsView";

export default function Labels() {
  const { labels, updateLabel, toggleLabelManager } = useContext(GlobalContext);
  const [showLabelEventsModal, setShowLabelEventsModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);

  const handleLabelClick = (label) => {
    setSelectedLabel(label);
    setShowLabelEventsModal(true);
  };

  return (
    <React.Fragment>
      <div className="flex items-center mt-10">
        <p className="text-gray-500 font-bold dark:text-white">Labels</p>
        <span className="material-icons text-gray-500 ml-32" onClick={toggleLabelManager}>
          settings
        </span>
      </div>
      {labels.map(({ name, color, checked }, idx) => (
        <div key={idx} className="items-center mt-3 block">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => updateLabel({ name, color, checked: !checked })}
            className="form-checkbox h-5 w-5 rounded focus:ring-0 cursor-pointer"
            style={{ borderColor: color, backgroundColor: checked ? color : 'transparent' }}
          />
          <span className="ml-2 text-gray-700 capitalize cursor-pointer dark:text-white" onClick={() => handleLabelClick({ name, color })}>
            {name}
          </span>
        </div>
      ))}
      {showLabelEventsModal && (
        <LabelEventsModal label={selectedLabel} setShowLabelEventsModal={setShowLabelEventsModal} />
      )}
    </React.Fragment>
  );
}