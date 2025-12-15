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
                "btn disabled:opacity-50 disabled:cursor-not-allowed",
                {
                    'bg-[#064e3b] text-white hover:bg-[#065f46] shadow-md hover:shadow-lg': variant === 'primary',
                    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300': variant === 'secondary',
                    'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50': variant === 'outline',
                    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900': variant === 'ghost',
                    'bg-red-600 text-white hover:bg-red-700 shadow-sm': variant === 'danger',

                    'px-3 py-1.5 text-sm': size === 'sm',
                    'px-4 py-2.5 text-sm': size === 'md',
                    'px-6 py-3 text-base': size === 'lg',
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
