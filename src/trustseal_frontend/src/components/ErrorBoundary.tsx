import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement error logging service
      console.error('Production error:', { error, errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="container">
            <div className="header">
              <h1>⚠️ Something went wrong</h1>
              <p>We're sorry, but something unexpected happened.</p>
            </div>
            
            <div className="card">
              <h2>Error Details</h2>
              {this.state.error && (
                <div className="error-details">
                  <p><strong>Error:</strong> {this.state.error.message}</p>
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details>
                      <summary>Stack Trace</summary>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="actions">
                <button 
                  className="btn" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </button>
                <button 
                  className="btn secondary" 
                  onClick={() => this.setState({ hasError: false })}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;