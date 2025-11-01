import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, handleApiError } from '../utils/errorHandler';

interface GraphQLErrorHandlerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to handle GraphQL errors and redirect to appropriate error pages
 */
const GraphQLErrorHandler: React.FC<GraphQLErrorHandlerProps> = ({ children, fallback }) => {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Listen for GraphQL errors
    const handleGlobalError = (event: ErrorEvent) => {
      // Only handle GraphQL errors
      if (
        event.error && 
        (event.error.graphQLErrors || 
         (event.error.message && event.error.message.includes('GraphQL')) ||
         (event.error.message && event.error.message.includes('No response')))
      ) {
        event.preventDefault();
        
        const apiError = handleApiError(event.error);
        
        // Redirect to error page for network or server errors
        if (apiError.type === 'network' || apiError.type === 'server') {
          setHasError(true);
          navigate('/error', { 
            state: { 
              errorType: apiError.type,
              message: apiError.message,
              canRetry: true
            },
            replace: true
          });
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle GraphQL promise rejections
      if (
        event.reason && 
        (event.reason.graphQLErrors || 
         (event.reason.message && event.reason.message.includes('GraphQL')))
      ) {
        event.preventDefault();
        
        const apiError = handleApiError(event.reason);
        
        if (apiError.type === 'network' || apiError.type === 'server') {
          setHasError(true);
          navigate('/error', { 
            state: { 
              errorType: apiError.type,
              message: apiError.message,
              canRetry: true
            },
            replace: true
          });
        }
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [navigate]);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default GraphQLErrorHandler;