import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error.message, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h1>
            <p className="text-gray-600 mb-6">
              申し訳ございません。画面の表示中にエラーが発生しました。
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="px-6 py-2 bg-[#0a3a2a] text-white rounded-md hover:bg-[#0d4a36] transition-colors"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
