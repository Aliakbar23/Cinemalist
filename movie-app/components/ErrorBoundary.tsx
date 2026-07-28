"use client";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
            <p className="text-5xl mb-4">😵</p>
            <h2 className="font-display text-xl font-bold text-text mb-2">
              Ups! Terjadi kesalahan
            </h2>
            <p className="text-sm text-muted mb-4 max-w-md">
              Sepertinya ada yang salah. Coba muat ulang halaman atau kembali ke beranda.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="rounded-xl bg-cinema px-5 py-2.5 text-sm font-semibold text-white shadow-cinema hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all"
              >
                Coba Lagi
              </button>
              <a
                href="/"
                className="rounded-xl glass border border-white/10 px-5 py-2.5 text-sm font-semibold text-text hover:bg-purple/10 transition-all"
              >
                ke Beranda
              </a>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
