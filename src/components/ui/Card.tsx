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
                "rounded-2xl transition-all duration-300 relative overflow-hidden",
                {
                    'bg-white border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]': variant === 'default' || variant === 'glass',
                    'bg-transparent border border-slate-200': variant === 'outline',
                    'hover:shadow-[0_12px_24px_-8px_rgba(5,150,105,0.15)] hover:-translate-y-1 hover:border-emerald-600/40': hoverEffect
                },
                className
            )}
            {...props}
        >
            {hoverEffect && (
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/0 via-emerald-50/50 to-emerald-50/0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}
            <div className="relative z-10">{children}</div>
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pb-2", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("text-lg font-bold text-slate-800", className)} {...props}>{children}</h3>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pt-2", className)} {...props}>{children}</div>;
}
