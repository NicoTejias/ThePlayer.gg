
import React from 'react';

const ScaleIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 0010 0l3-9M3 6l6 9m6-9l-3 1m0 0l3 9a5.002 5.002 0 00-10 0l-3-9m12 0h.01M5 21h14" />
    </svg>
);

export default ScaleIcon;