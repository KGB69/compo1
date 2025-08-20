import React from 'react';

interface UIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    size?: 'md' | 'sm';
}

export const UIButton: React.FC<UIButtonProps> = ({ children, className, variant = 'primary', size = 'md', ...props }) => {
    
    const baseClasses = "font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
    
    const variantClasses = {
        primary: "bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-500",
        secondary: "bg-slate-600 hover:bg-slate-700 text-slate-100 focus:ring-slate-500",
    };

    const sizeClasses = {
        md: "px-6 py-2 text-lg",
        sm: "px-3 py-1 text-base",
    }
    
    const combinedClasses = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
    ].join(' ');

    return (
        <button className={combinedClasses} {...props}>
            {children}
        </button>
    );
};
