import React from 'react';

const QrcodeIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 4.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15h.008v.008H15V15zm.75 3.75h.008v.008h-.008v-.008zm0-1.5h.008v.008h-.008v-.008zm-1.5 0h.008v.008h-.008v-.008zM15 18h.008v.008H15v-.008zm.75-1.5h.008v.008h-.008v-.008zm1.5-1.5h.008v.008h-.008V15zm0 1.5h.008v.008h-.008v-.008zm0 1.5h.008v.008h-.008v-.008zm-3-1.5h.008v.008h-.008v-.008zm-1.5 0h.008v.008h-.008v-.008zm-1.5 0h.008v.008H15v-.008z" />
  </svg>
);

export default QrcodeIcon;
