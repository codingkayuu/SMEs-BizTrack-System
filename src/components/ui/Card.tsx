import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outline';
    hoverEffect?: boolean;
}

export function Card({
    className,
    variant = 'default',
    hoverEffect = false,
    children,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl transition-all duration-300",
                {
                    'bg-white border border-gray-100 shadow-sm': variant === 'default',
                    'glass-card': variant === 'glass',
                    'bg-transparent border border-gray-200': variant === 'outline',
                    'hover:shadow-lg hover:-translate-y-1': hoverEffect
                },
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pb-2", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("text-lg font-bold text-gray-900", className)} {...props}>{children}</h3>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pt-2", className)} {...props}>{children}</div>;
}
