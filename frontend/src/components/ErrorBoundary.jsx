import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI crash captured by ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950">
          <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The page hit an unexpected error. Your data is safe. Reload to continue —
              if this keeps happening, contact support.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary mt-6 px-6 py-2.5"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
