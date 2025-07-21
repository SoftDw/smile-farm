
import React from 'react';

const HumidityIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2.69l5.66 5.66a8 8 0 11-11.32 0L12 2.69z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 12.16V17"
        />
        <path
             strokeLinecap="round"
             strokeLinejoin="round"
             d="M14.12 11.05a4 4 0 00-4.24 0"
        />
    </svg>
);

export default HumidityIcon;
