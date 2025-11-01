import { useEffect } from 'react';
import {
	RouterProvider
} from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import GraphQLErrorHandler from './components/GraphQLErrorHandler';
import { useAuthStore } from './store/authStore';
import { useLanguageStore } from './store/languageStore';
import { useEnhancedProfileRefresh } from './hooks/useEnhancedProfileRefresh.ts';

import ToastConfig from './config/ToastConfig';
import { router } from './config/router.tsx';

import PWAInstallPrompt from './components/PWAInstallPrompt';

import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { connectWebSocket, disconnectWebSocket } from 'vocallabs_agent_web';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import {LocationProvider} from './context/LocationContext';


function App() {
	const { user, isAuthenticated } = useAuthStore();
	const { isChangingLanguage } = useLanguageStore();
	useEnhancedProfileRefresh();

	// Scroll to top on route change (handled manually here)
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [location?.pathname]);

	// WebSocket connection
	useEffect(() => {
		if (!isAuthenticated) return;

		connectWebSocket(user?.id, 'go-fiber-ayft.onrender.com');
		return () => disconnectWebSocket();
	}, [isAuthenticated]);

	// Update user activity
	useEffect(() => {
		const updateProfile = async () => {
			const { user } = useAuthStore.getState();
			if (!user?.auth_token) return false;

			try {
				const response = await fetch('https://db.subspace.money/v1/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${user.auth_token}`,
					},
					body: JSON.stringify({
						query: `
              mutation Mutate($user_id: uuid, $time: timestamptz) {
                update_auth(where: { id: { _eq: $user_id } }, _set: { last_active: $time }) {
                  affected_rows
                }
              }`,
						variables: { user_id: user.id, time: new Date().toISOString() },
					}),
				});
				const result = await response.json();
				return result.data?.update_auth?.affected_rows > 0;
			} catch (error) {
				console.error('Error updating profile:', error);
				return false;
			}
		};

		if (isAuthenticated) {
			const intervalId = setInterval(updateProfile, 90_000);
			return () => clearInterval(intervalId);
		}

		updateProfile();
	}, [isAuthenticated]);

	if (isChangingLanguage) {
		return (
			<div className="fixed inset-0 bg-dark-800 flex items-center justify-center z-[100]">
				<div className="flex flex-col items-center gap-4">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
					<p className="text-gray-300 text-lg">
						{isChangingLanguage ? 'Changing language...' : 'Loading...'}
					</p>
				</div>
			</div>
		);
	}

return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <SkeletonTheme baseColor="#2a2a2a" highlightColor="#3a3a3a" duration={1.5}>
          <RouterProvider router={router}>
            <GraphQLErrorHandler />
          </RouterProvider>
          
          <PWAInstallPrompt />
          <ToastConfig />
        </SkeletonTheme>
              <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      </LocationProvider>
    </QueryClientProvider>
  </ErrorBoundary>

  );
}



export default App;
