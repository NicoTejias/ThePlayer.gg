
import React from 'react';

interface CardProps {
  imageUrl: string;
  title: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ imageUrl, title, children, footerContent }) => {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <img className="w-full h-48 object-cover" src={imageUrl} alt={title} />
      <div className="p-6">
        <h3 className="font-bold text-xl mb-2 text-white">{title}</h3>
        <div className="text-slate-300 text-base">{children}</div>
      </div>
      {footerContent && (
        <div className="px-6 pt-4 pb-4 border-t border-slate-700">
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default Card;
