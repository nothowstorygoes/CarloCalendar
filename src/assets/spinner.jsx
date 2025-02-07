import React from "react";
import "./spinner.css"; // Import the CSS file for the spinner

const Spinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner border-t-gray-200 dark:!border-t-white"></div>
    </div>
  );
};

export default Spinner;