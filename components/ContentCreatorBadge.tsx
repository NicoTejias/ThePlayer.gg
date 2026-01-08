import React from 'react';

interface ContentCreatorBadgeProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const ContentCreatorBadge: React.FC<ContentCreatorBadgeProps> = ({ size = 'medium', className = '' }) => {
    const sizeClasses = {
        small: 'text-xs px-2 py-0.5',
        medium: 'text-sm px-3 py-1',
        large: 'text-base px-4 py-1.5'
    };

    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white shadow-lg shadow-orange-900/50 border-2 border-orange-400 ${sizeClasses[size]} ${className}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <span>Creator</span>
        </div>
    );
};

export default ContentCreatorBadge;
