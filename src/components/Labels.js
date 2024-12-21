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
      <div className="mt-4 overflow-auto">
        {sortedLabels.map(({ name, code, color, checked }, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center p-2 rounded cursor-pointer text-white font-bold mb-5"
            style={{ backgroundColor: color }}
            onClick={() => handleLabelClick({ name, code, color })}
          >
            {name}
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}