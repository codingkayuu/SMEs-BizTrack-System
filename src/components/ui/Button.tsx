import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ElementType;
    rightIcon?: React.ElementType;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    children,
    disabled,
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
                "btn disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all duration-200",
                {
                    'btn-primary bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 border-transparent': variant === 'primary',
                    'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 shadow-sm': variant === 'secondary',
                    'bg-transparent border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white': variant === 'outline',
                    'bg-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-600': variant === 'ghost',
                    'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/30': variant === 'danger',

                    'px-3 py-1.5 text-xs font-medium rounded-lg': size === 'sm',
                    'px-5 py-2.5 text-sm font-semibold rounded-xl': size === 'md',
                    'px-8 py-3.5 text-base font-bold rounded-2xl': size === 'lg',
                },
                className
            )}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isLoading && LeftIcon && <LeftIcon className="w-4 h-4 mr-2" />}
            {children}
            {!isLoading && RightIcon && <RightIcon className="w-4 h-4 ml-2" />}
        </button>
    );
});

Button.displayName = "Button";
