import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '24px', background: '#F0F1F3',
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '40px',
            maxWidth: '500px', width: '100%', textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ color: '#DC2626', marginBottom: '12px' }}>Something went wrong</h2>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/dashboard';
              }}
              style={{
                background: '#714B67', color: '#fff', border: 'none',
                padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 600,
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
