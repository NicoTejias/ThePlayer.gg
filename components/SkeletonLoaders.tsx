import React from 'react';

export const EventCardSkeleton: React.FC = () => (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 skeleton-pulse">
        <div className="h-5 bg-slate-700 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-2/3 mb-3"></div>
        <div className="flex justify-between items-center mt-4">
            <div className="h-6 bg-slate-700 rounded w-20"></div>
            <div className="h-8 bg-slate-700 rounded w-24"></div>
        </div>
    </div>
);

export const RankingRowSkeleton: React.FC = () => (
    <div className="flex items-center gap-3 p-3 border-b border-slate-700/50 skeleton-pulse">
        <div className="w-6 h-6 bg-slate-700 rounded"></div>
        <div className="flex-1">
            <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-1/3"></div>
        </div>
        <div className="h-5 bg-slate-700 rounded w-16"></div>
    </div>
);

export const StatCardSkeleton: React.FC = () => (
    <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 skeleton-pulse">
        <div className="w-12 h-12 bg-slate-700 rounded-full mb-4 mx-auto"></div>
        <div className="h-8 bg-slate-700 rounded w-16 mx-auto mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-24 mx-auto"></div>
    </div>
);

export const ArticleCardSkeleton: React.FC = () => (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 skeleton-pulse">
        <div className="flex gap-4 p-4">
            <div className="w-32 h-32 bg-slate-700 rounded-lg flex-shrink-0"></div>
            <div className="flex-1 flex flex-col">
                <div className="h-5 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-2/3 mb-3 flex-1"></div>
                <div className="flex justify-between">
                    <div className="h-3 bg-slate-700 rounded w-20"></div>
                    <div className="h-3 bg-slate-700 rounded w-24"></div>
                </div>
            </div>
        </div>
    </div>
);

export const VideoCardSkeleton: React.FC = () => (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 skeleton-pulse">
        <div className="flex gap-4 p-4">
            <div className="w-40 h-28 bg-slate-700 rounded-lg flex-shrink-0"></div>
            <div className="flex-1 flex flex-col">
                <div className="h-5 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-3 flex-1"></div>
                <div className="flex justify-between">
                    <div className="h-3 bg-slate-700 rounded w-16"></div>
                    <div className="h-3 bg-slate-700 rounded w-20"></div>
                </div>
            </div>
        </div>
    </div>
);
