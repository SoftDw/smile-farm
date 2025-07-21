
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className, icon }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg hover:-translate-y-1 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-farm-green-dark">{title}</h3>
        {icon && <div className="text-farm-green">{icon}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default Card;
