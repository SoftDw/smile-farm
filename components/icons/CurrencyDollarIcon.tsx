
import React from 'react';

const CurrencyDollarIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
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
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4a2 2 0 00-2-2h-4a2 2 0 00-2 2v1m12 9a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h4"
    />
  </svg>
);

export default CurrencyDollarIcon;
