import React, { useState } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';
import { type LucideIcon, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: LucideIcon;
    registration?: Partial<UseFormRegisterReturn>;
    error?: string;
}

export function FloatingInput({ label, icon: Icon, registration, error, className, type = "text", ...props }: FloatingInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    // We check value presence from props (controlled) or internal state could be complex with RHF.
    // simpler to rely on focus or value presence via manual check if needed, but RHF relies on ref.
    // A CSS-only approach using :placeholder-shown is often cleaner for "floating" labels without complex state syncing.

    // However, to strictly follow "icon color change on focus" we need JS state.

    return (
        <div className="relative mb-5">
            <div className="relative group">
                {Icon && (
                    <div className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none z-10",
                        isFocused ? "text-primary-600" : "text-gray-400"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}

                <input
                    type={inputType}
                    className={cn(
                        "peer block w-full rounded-xl border-gray-200 bg-white/50 dark:bg-slate-800/50 px-4 pt-6 pb-2 text-gray-900 dark:text-white placeholder-transparent focus:border-[#00A86B] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#00A86B]/10 transition-all duration-300 outline-none h-[52px]",
                        Icon ? "pl-12" : "",
                        isPassword ? "pr-12" : "",
                        error ? "border-[#DE2010] focus:border-[#DE2010] focus:ring-[#DE2010]/10 bg-red-50/10" : "",
                        className
                    )}
                    placeholder={label}
                    {...props}
                    {...registration}
                    onFocus={(e) => {
                        setIsFocused(true);
                        registration?.onBlur && registration.onBlur(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        registration?.onBlur && registration.onBlur(e);
                    }}
                />

                <label
                    className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 pointer-events-none origin-[0]",
                        Icon ? "peer-placeholder-shown:left-12" : "",
                        "peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:top-4 peer-focus:text-[#00A86B] peer-focus:font-semibold",
                        "peer-not-placeholder-shown:-translate-y-3 peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:top-4 pointer-events-none",
                        Icon ? "peer-focus:left-12 peer-not-placeholder-shown:left-12" : "" // Keep label aligned with text start
                    )}
                >
                    {label}
                </label>

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center animate-in slide-in-from-top-1 fade-in duration-200">
                    {error}
                </p>
            )}
        </div>
    );
}
