import React from 'react';

interface SubscriptionBadgeProps {
    tier: 'free' | 'basic' | 'medium' | 'premium';
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ tier, size = 'medium', className = '' }) => {
    if (tier === 'free') return null;

    const sizeClasses = {
        small: 'text-xs px-2 py-0.5',
        medium: 'text-sm px-3 py-1',
        large: 'text-base px-4 py-1.5'
    };

    const badges = {
        premium: {
            label: 'PREMIUM',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ),
            className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-orange-900/50 border-2 border-yellow-400'
        },
        medium: {
            label: 'VERIFIED',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ),
            className: 'bg-sky-600 text-white shadow-md shadow-sky-900/50 border border-sky-400'
        },
        basic: {
            label: 'BASIC',
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ),
            className: 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50 border border-emerald-400'
        }
    };

    const badge = badges[tier];

    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${sizeClasses[size]} ${badge.className} ${className}`}>
            {badge.icon}
            <span>{badge.label}</span>
        </div>
    );
};

export default SubscriptionBadge;
