import React, { useContext } from "react";
import GlobalContext from "../context/GlobalContext";
import { useTranslation } from "react-i18next";

export default function Labels() {
  const { labels, setViewMode, setSelectedLabel } =
    useContext(GlobalContext);
  const { t } = useTranslation();

  const handleLabelClick = (label) => {
    setSelectedLabel(label);
    setViewMode("label");
  };

  const handleSettingsClick = () => {
    setViewMode("labelManager");
  };

  const sortedLabels = [...labels].sort((a, b) => a.code - b.code);

  return (
    <React.Fragment>
      <div
        className="flex items-center"
        style={{
          "--scrollbar-track-bg": document.documentElement.classList.contains(
            "dark"
          )
            ? "#3f3f46"
            : "#e5e7eb",
        }}
      >
        <p className="text-gray-500 font-bold dark:text-white">{t("labels")}</p>
        <span
          className="material-icons text-gray-500 ml-28 cursor-pointer"
          onClick={handleSettingsClick}
        >
          settings
        </span>
      </div>
      <div className="mt-4 h-72 overflow-y-auto custom-scrollbar">
        {" "}
        {/* Set a fixed height and enable vertical scrolling */}
        {sortedLabels.map(({ name, code, color, checked }, idx) => (
          <div
            key={idx}
            className="w-40 flex items-center justify-between p-1 rounded cursor-pointer text-black font-bold mb-2 text-sm"
            style={{ backgroundColor: color }}
            onClick={() => handleLabelClick({ name, code, color })}
          >
            <p className="truncate">{name}</p><p>{code}</p>
          </div>
        ))}
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
    </React.Fragment>
  );
}
