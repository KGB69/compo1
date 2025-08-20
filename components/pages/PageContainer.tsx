import React from 'react';

interface PageContainerProps {
    title: string;
    breadcrumbs: string[];
    children: React.ReactNode;
    onClose?: () => void;
}

export const PageContainer: React.FC<PageContainerProps> = ({ title, breadcrumbs, children, onClose }) => {
    return (
        <div className="relative w-full h-full bg-slate-900 bg-opacity-80 backdrop-blur-sm p-8 flex flex-col rounded-2xl border-4 border-sky-500/50 shadow-2xl shadow-sky-500/20">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white bg-red-600 hover:bg-red-700 rounded-full p-1 transition-colors z-10"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
            <div className="flex-shrink-0 mb-4">
                <div className="text-sky-300 text-sm mb-2">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={index}>
                            {crumb} {index < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
                        </span>
                    ))}
                </div>
                <h1 className="text-3xl font-bold text-white tracking-wider">{title}</h1>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center relative">
                {children}
            </div>
        </div>
    )
}