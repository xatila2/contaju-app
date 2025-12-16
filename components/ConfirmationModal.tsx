import React from 'react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: 'text-rose-600 dark:text-rose-400',
            bgIcon: 'bg-rose-100 dark:bg-rose-900/30',
            button: 'bg-rose-600 hover:bg-rose-700 text-white',
            border: 'border-rose-200 dark:border-rose-800'
        },
        warning: {
            icon: 'text-yellow-600 dark:text-yellow-400',
            bgIcon: 'bg-yellow-100 dark:bg-yellow-900/30',
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
            border: 'border-yellow-200 dark:border-yellow-800'
        },
        info: {
            icon: 'text-blue-600 dark:text-blue-400',
            bgIcon: 'bg-blue-100 dark:bg-blue-900/30',
            button: 'bg-blue-600 hover:bg-blue-700 text-white',
            border: 'border-blue-200 dark:border-blue-800'
        }
    };

    const colorScheme = colors[type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border ${colorScheme.border} transform transition-all scale-100`}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full flex-shrink-0 ${colorScheme.bgIcon} ${colorScheme.icon}`}>
                            <AlertCircle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-6">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm ${colorScheme.button}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
