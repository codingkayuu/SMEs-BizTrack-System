import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
                aria-hidden="true"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    {/* Modal Panel */}
                    {/* Modal Panel - Mobile: Full Screen/Bottom Sheetish, Desktop: Standard Modal */}
                    <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full h-full sm:h-auto sm:my-8 sm:max-w-lg sm:p-8 animate-in zoom-in-95 duration-300 border border-slate-200 ring-1 ring-black/5 flex flex-col sm:block">

                        <div className="absolute top-0 right-0 hidden pt-6 pr-6 sm:block">
                            <button
                                type="button"
                                className="rounded-full bg-emerald-50 p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                                onClick={onClose}
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="sm:flex sm:items-start w-full">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full flex-1 overflow-y-auto sm:overflow-visible p-6 sm:p-0">
                                <h3 className="text-2xl font-bold leading-6 text-slate-900 tracking-tight flex items-center gap-3 sticky top-0 bg-white z-10 pb-4 sm:static sm:pb-0" id="modal-title">
                                    <span className="w-2 h-8 bg-emerald-600 rounded-full inline-block"></span>
                                    {title}
                                </h3>
                                <div className="mt-4 w-full">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
