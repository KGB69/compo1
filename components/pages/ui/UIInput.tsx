import React from 'react';

interface UIInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const UIInput: React.FC<UIInputProps> = ({ className, ...props }) => {
    
    const baseClasses = "bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-lg rounded-md focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5";
    
    const combinedClasses = [
        baseClasses,
        className
    ].join(' ');

    return (
        <input className={combinedClasses} {...props} />
    );
};
