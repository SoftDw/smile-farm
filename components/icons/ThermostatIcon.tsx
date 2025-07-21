
import React from 'react';

const ThermostatIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 13.5a3 3 0 013-3h1.5a3 3 0 013 3v6a3 3 0 01-3 3H12a3 3 0 01-3-3v-6z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v10.5m0 0a3 3 0 01-3 3H7.5a3 3 0 01-3-3V7.5a3 3 0 013-3h1.5"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6" />
  </svg>
);

export default ThermostatIcon;
