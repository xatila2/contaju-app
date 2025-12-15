
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-xl max-w-2xl w-full border border-rose-200 dark:border-rose-900">
                        <h1 className="text-2xl font-bold text-rose-600 mb-4">Algo deu errado (Erro de Renderização)</h1>
                        <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                            Ocorreu um erro que impediu o carregamento da página. Por favor, envie o erro abaixo para o suporte.
                        </p>

                        <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-lg overflow-auto max-h-[400px] border border-zinc-200 dark:border-zinc-800 font-mono text-sm">
                            <div className="text-rose-600 font-bold mb-2">
                                {this.state.error?.toString()}
                            </div>
                            <pre className="text-zinc-500 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Tentar Recarregar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
