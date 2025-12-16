import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000); // Auto dismiss after 5s
    }, [removeToast]);

    const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
    const errorFn = useCallback((message: string) => showToast(message, 'error'), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error: errorFn }}>
            {children}
            {createPortal(
                <div
                    className="fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-none"
                    style={{ zIndex: 9999 }}
                >
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className={`flex items-center w-full max-w-sm px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto ${toast.type === 'success'
                                ? 'bg-white border-green-500 text-gray-800'
                                : 'bg-white border-red-500 text-gray-800'
                                }`}
                            role="alert"
                        >
                            <div className="flex-shrink-0">
                                {toast.type === 'success' ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                )}
                            </div>
                            <div className="ml-3 text-sm font-medium pr-4">{toast.message}</div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 text-gray-400 hover:text-gray-900 focus:ring-2 focus:ring-gray-300"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
