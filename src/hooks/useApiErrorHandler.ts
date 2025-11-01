import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleApiError, ApiError } from '../utils/errorHandler';

export const useApiErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = useCallback((error: any): ApiError => {
    const apiError = handleApiError(error);
    
    // For critical errors, navigate to error page
    if (apiError.type === 'network' || apiError.type === 'server') {
      navigate('/error', { 
        state: { 
          errorType: apiError.type,
          message: apiError.message,
          canRetry: true
        },
        replace: true
      });
    }
    
    return apiError;
  }, [navigate]);

  return { handleError };
};