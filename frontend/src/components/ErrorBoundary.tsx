import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '48px 24px',
          textAlign: 'center',
          fontFamily: 'var(--font, system-ui)',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            fontSize: '1.5rem',
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary, #1a1a1a)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-secondary, #666)', fontSize: '0.875rem', maxWidth: 400, marginBottom: 20, lineHeight: 1.6 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <p style={{ color: 'var(--text-muted, #999)', fontSize: '0.75rem', fontFamily: 'monospace', maxWidth: 500, wordBreak: 'break-word', marginBottom: 20 }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--primary, #1a8a4a)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
