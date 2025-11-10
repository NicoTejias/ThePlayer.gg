
import React from 'react';

const TagIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm0 0v11.5a2.5 2.5 0 002.5 2.5h3.879a2.5 2.5 0 001.768-.732l4.12-4.12a2.5 2.5 0 000-3.536L15.267 3.732A2.5 2.5 0 0013.5 3H7z" />
    </svg>
);

export default TagIcon;
