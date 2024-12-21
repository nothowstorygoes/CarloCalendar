import React, { useContext } from "react";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from 'react-i18next';

export default function Labels() {
  const { labels, updateLabel, setViewMode, setSelectedLabel } = useContext(GlobalContext);
  const { t } = useTranslation();

  const handleLabelClick = (label) => {
    setSelectedLabel(label);
    setViewMode("label");
  };

  const handleSettingsClick = () => {
    setViewMode("labelManager");
  };

  const sortedLabels = [...labels].sort((a, b) => a.code.localeCompare(b.code));


  return (
    <React.Fragment>
      <div className="flex items-center mt-10">
        <p className="text-gray-500 font-bold dark:text-white">{t("labels")}</p>
        <span className="material-icons text-gray-500 ml-28 cursor-pointer" onClick={handleSettingsClick}>
          settings
        </span>
      </div>
      <div className="mt-4 h-72 overflow-y-auto custom-scrollbar"> {/* Set a fixed height and enable vertical scrolling */}
        {sortedLabels.map(({ name, code, color, checked }, idx) => (
          <div
            key={idx}
            className="flex items-center justify-start p-1 rounded cursor-pointer text-white font-bold mb-2 text-sm w-40"
            style={{ backgroundColor: color }}
            onClick={() => handleLabelClick({ name, code, color })}
          >
            {name}
          </div>
        ))}
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
    </React.Fragment>
  );
}