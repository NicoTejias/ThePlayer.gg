import React from 'react';

interface PricingCardProps {
    title: string;
    price: string;
    period?: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
    ctaText?: string;
    onCTAClick?: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
    title,
    price,
    period = '/mes',
    features,
    highlighted = false,
    badge,
    ctaText = 'Comenzar',
    onCTAClick
}) => {
    return (
        <div className={`relative rounded-2xl p-8 transition-all duration-300 flex flex-col h-full ${highlighted
            ? 'bg-gradient-to-br from-sky-600 to-blue-700 shadow-2xl shadow-sky-900/50 scale-105 border-2 border-sky-400 z-10'
            : 'bg-slate-800 border border-slate-700 hover:border-sky-500/50 hover:shadow-xl'
            }`}>
            {/* Badge */}
            {badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg uppercase tracking-wider">
                        {badge}
                    </span>
                </div>
            )}

            {/* Title */}
            <h3 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-white' : 'text-white'}`}>
                {title}
            </h3>

            {/* Price */}
            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${highlighted ? 'text-white' : 'text-sky-400'}`}>
                        ${price}
                    </span>
                    <span className={`text-lg ${highlighted ? 'text-sky-100' : 'text-slate-400'}`}>
                        {period}
                    </span>
                </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <svg
                            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${highlighted ? 'text-sky-200' : 'text-sky-400'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm ${highlighted ? 'text-white' : 'text-slate-300'}`}>
                            {feature}
                        </span>
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <button
                onClick={onCTAClick}
                className={`w-full py-3 px-6 rounded-lg font-bold transition-all mt-auto ${highlighted
                    ? 'bg-white text-sky-600 hover:bg-sky-50 shadow-lg'
                    : 'bg-sky-600 text-white hover:bg-sky-500'
                    }`}
            >
                {ctaText}
            </button>
        </div>
    );
};

export default PricingCard;
