import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WifiOff, RefreshCw, Home, Server, AlertTriangle, Clock, Shield } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'network' | 'server' | 'graphql' | 'timeout' | 'unknown';
  retryCount: number;
  isOnline: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private networkListener: (() => void) | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isOnline: navigator.onLine
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorType = ErrorBoundary.determineErrorType(error);
    return {
      hasError: true,
      error,
      errorType
    };
  }

  static determineErrorType(error: Error): State['errorType'] {
    const message = error.message?.toLowerCase() || '';
    
    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('offline') ||
      !navigator.onLine
    ) {
      return 'network';
    }
    
    // Server errors
    if (
      message.includes('server') ||
      message.includes('500') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('internal server error')
    ) {
      return 'server';
    }
    
    // GraphQL errors
    if (
      message.includes('graphql') ||
      message.includes('query') ||
      message.includes('mutation') ||
      error.name === 'GraphQLError'
    ) {
      return 'graphql';
    }
    
    // Timeout errors
    if (
      message.includes('timeout') ||
      message.includes('aborted') ||
      error.name === 'AbortError'
    ) {
      return 'timeout';
    }
    
    return 'unknown';
  }

  componentDidMount() {
    // Listen for network status changes
    this.networkListener = () => {
      this.setState({ isOnline: navigator.onLine });
      
      // If we come back online and had a network error, auto-retry
      if (navigator.onLine && this.state.hasError && this.state.errorType === 'network') {
        this.handleAutoRetry();
      }
    };
    
    window.addEventListener('online', this.networkListener);
    window.addEventListener('offline', this.networkListener);
    
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Listen for global errors
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    if (this.networkListener) {
      window.removeEventListener('online', this.networkListener);
      window.removeEventListener('offline', this.networkListener);
    }
    
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
    
    // Clear any pending timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error for monitoring
    this.logError(error, errorInfo);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = new Error(event.reason?.message || 'Unhandled promise rejection');
    const errorType = ErrorBoundary.determineErrorType(error);
    
    this.setState({
      hasError: true,
      error,
      errorType,
      errorInfo: null
    });
    
    this.logError(error);
  };

  handleGlobalError = (event: ErrorEvent) => {
  const error = event.error || new Error(event.message);

  // 🩹 Ignore harmless ResizeObserver warnings
  if (
    error.message?.includes('ResizeObserver loop completed') ||
    error.message?.includes('ResizeObserver loop limit exceeded')
  ) {
    if (import.meta.env.DEV) {
      console.debug('Ignored benign ResizeObserver warning:', error.message);
    }
    return; // ✅ Skip triggering error UI or state updates
  }

  const errorType = ErrorBoundary.determineErrorType(error);

  this.setState({
    hasError: true,
    error,
    errorType,
    errorInfo: null
  });

  this.logError(error);
};


  logError = (error: Error, errorInfo?: ErrorInfo) => {
    // Log to console for development
    console.error('Error Boundary caught an error:', error);
    if (errorInfo) {
      console.error('Error Info:', errorInfo);
    }
    
    // In production, you would send this to your error reporting service
    // Example: Sentry, LogRocket, etc.
  };

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount
    });
    
    // For network errors, wait a bit before reloading
    if (this.state.errorType === 'network') {
      const timeout = setTimeout(() => {
        window.location.reload();
      }, 1000);
      this.retryTimeouts.push(timeout);
    } else {
      window.location.reload();
    }
  };

  handleAutoRetry = () => {
    // Only auto-retry for network errors and limit attempts
    if (this.state.errorType === 'network' && this.state.retryCount < 3) {
      const timeout = setTimeout(() => {
        this.handleRetry();
      }, 2000);
      this.retryTimeouts.push(timeout);
    }
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/';
  };

  getErrorConfig = () => {
    const { errorType } = this.state;
    
    switch (errorType) {
      case 'network':
        return {
          icon: <WifiOff className="h-16 w-16 text-red-400" />,
          title: 'Network Error',
          description: 'Unable to connect to the internet. Please check your network connection and try again.',
          color: 'red',
          gradient: 'from-red-500/20 to-pink-500/20',
          border: 'border-red-500/30',
          suggestions: [
            'Check your internet connection',
            'Try switching between WiFi and mobile data',
            'Restart your router or modem',
            'Contact your internet service provider'
          ]
        };
      
      case 'server':
        return {
          icon: <Server className="h-16 w-16 text-blue-400" />,
          title: 'Server Error',
          description: 'Our servers are currently experiencing issues. Our team has been notified and is working to resolve this.',
          color: 'blue',
          gradient: 'from-blue-500/20 to-indigo-500/20',
          border: 'border-blue-500/30',
          suggestions: [
            'Try again in a few minutes',
            'Check our status page for updates',
            'Contact support if the issue persists'
          ]
        };
      
      case 'graphql':
        return {
          icon: <AlertTriangle className="h-16 w-16 text-purple-400" />,
          title: 'Data Error',
          description: 'There was an issue loading your data. This might be a temporary problem.',
          color: 'purple',
          gradient: 'from-purple-500/20 to-pink-500/20',
          border: 'border-purple-500/30',
          suggestions: [
            'Refresh the page',
            'Try again in a moment',
            'Check your internet connection',
            'Contact support if the issue continues'
          ]
        };
      
      case 'timeout':
        return {
          icon: <Clock className="h-16 w-16 text-orange-400" />,
          title: 'Request Timeout',
          description: 'The request took too long to complete. This might be due to a slow connection or server issues.',
          color: 'orange',
          gradient: 'from-orange-500/20 to-yellow-500/20',
          border: 'border-orange-500/30',
          suggestions: [
            'Check your internet speed',
            'Try again in a few moments',
            'Switch to a faster connection if available'
          ]
        };
      
      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-gray-400" />,
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.',
          color: 'gray',
          gradient: 'from-gray-500/20 to-slate-500/20',
          border: 'border-gray-500/30',
          suggestions: [
            'Refresh the page',
            'Clear your browser cache',
            'Try again in a few minutes',
            'Contact support if the issue persists'
          ]
        };
    }
  };

  render() {
    if (this.state.hasError) {
      const errorConfig = this.getErrorConfig();
      
      return (
        <div className="fixed inset-0 bg-gradient-to-br from-dark-600 via-dark-700 to-dark-800 flex items-center justify-center p-4 z-[9999]">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>

          <div className="relative z-10 w-full max-w-2xl">
            {/* Main error card */}
            <div className={`bg-gradient-to-br ${errorConfig.gradient} border ${errorConfig.border} rounded-3xl p-8 md:p-12 backdrop-blur-sm shadow-2xl`}>
              <div className="text-center">
                {/* Error icon with animation */}
                <div className="relative mb-8">
                  <div className={`w-32 h-32 mx-auto bg-${errorConfig.color}-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse`}>
                    {errorConfig.icon}
                  </div>
                  
                  {/* Connection status indicator */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                      this.state.isOnline 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {this.state.isOnline ? <Shield className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      <span>{this.state.isOnline ? 'Connected' : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {errorConfig.title}
                </h1>
                <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  {errorConfig.description}
                </p>

                {/* Suggestions */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">What you can try:</h3>
                  <ul className="text-left text-gray-300 space-y-2 max-w-md mx-auto">
                    {errorConfig.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Retry attempts indicator */}
                {this.state.retryCount > 0 && (
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 bg-dark-400/50 rounded-full px-4 py-2 text-sm text-gray-400">
                      <RefreshCw className="h-4 w-4" />
                      <span>Retry attempts: {this.state.retryCount}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={this.handleRetry}
                    className={`flex items-center justify-center gap-3 px-8 py-4 bg-${errorConfig.color}-500 hover:bg-${errorConfig.color}-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`}
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Try Again</span>
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-dark-400 hover:bg-dark-300 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <Home className="h-5 w-5" />
                    <span>Go Home</span>
                  </button>
                </div>

                {/* Additional help text */}
                <div className="mt-8 pt-6 border-t border-gray-700/50">
                  <p className="text-gray-400 text-sm mb-4">
                    {this.state.errorType === 'network' 
                      ? 'If you continue to have connection issues, please contact your internet service provider.'
                      : 'If the problem persists, please contact our support team.'
                    }
                  </p>
                  
                  {/* Status indicators */}
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className={`w-2 h-2 rounded-full ${this.state.isOnline ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                      <span>Network: {this.state.isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className={`w-2 h-2 rounded-full ${this.state.errorType === 'server' ? 'bg-red-400' : 'bg-yellow-400'} animate-pulse`}></div>
                      <span>Server: {this.state.errorType === 'server' ? 'Issues detected' : 'Checking...'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with branding */}
            <div className="text-center mt-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src="/subspace-hor_002.svg" alt="Subspace" className="h-6 w-auto opacity-60" />
              </div>
              <p className="text-gray-500 text-sm">
                Subspace - Subscription Management Platform
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;