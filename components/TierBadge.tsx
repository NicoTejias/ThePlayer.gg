import React from 'react';
import { getTier } from '../utils/tierUtils';

interface TierBadgeProps {
    points: number;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const TierBadge: React.FC<TierBadgeProps> = ({ points, showIcon = true, size = 'md' }) => {
    const tier = getTier(points);

    const sizeClasses = {
        sm: 'px-1.5 py-0.5 text-[9px]',
        md: 'px-2 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm'
    };

    return (
        <div className={`inline-flex items-center gap-1 font-black uppercase tracking-tighter rounded-full border ${tier.bgColor} ${tier.color} ${sizeClasses[size]} shadow-sm`}>
            {showIcon && <span>{tier.icon}</span>}
            {tier.name}
        </div>
    );
};

export default TierBadge;
