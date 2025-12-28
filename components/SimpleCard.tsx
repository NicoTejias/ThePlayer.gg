import React from 'react';

interface SimpleCardProps {
    children: React.ReactNode;
    className?: string;
}

const SimpleCard: React.FC<SimpleCardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ${className}`}>
            {children}
        </div>
    );
};

export default SimpleCard;
