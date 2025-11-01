import { GraphQLClient } from 'graphql-request';
import { authApi } from '../auth/api/authApi';
import { calculateTokenExpiry } from '../auth/utils/tokenUtils';

const PREVENT_RERENDERS = true; // Set to true to prevent UI re-rendering on token refresh
const REFRESH_DEBOUNCE_MS = 23 * 60 * 60 * 1000; // 23 hour debounce for production
const DEFAULT_ENDPOINT = 'https://db.vocallabs.ai/v1/graphql';
const pendingRequests: Map<string, Promise<any>> = new Map();
const lastTokenRefreshTime = {
	value: 0,
	// Add a method to check if refresh is needed
	shouldRefresh: function (now: number) {
		return now - this.value > REFRESH_DEBOUNCE_MS;
	}
}; // Shared object to track last refresh time

export const createGraphQLClient = (authToken?: string | null, customEndpoint?: string, enableAutoRefresh = true) => {
	const endpoint = customEndpoint || DEFAULT_ENDPOINT;
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
	};

	if (authToken) {
		headers['Authorization'] = `Bearer ${authToken}`;
	}

	// Function to get the latest token from localStorage
	const getLatestAuthToken = () => {
		try {
			const authData = localStorage.getItem('auth');
			if (authData) {
				const auth = JSON.parse(authData);
				return auth.authToken || authToken;
			}
		} catch (error) {
			// Silent error handling
		}
		return authToken;
	};

	const client = new GraphQLClient(endpoint, {
		headers,
		fetch: enableAutoRefresh ? createRefreshingFetch(getLatestAuthToken) : undefined
	});

	return client;
};

function createRefreshingFetch(getToken: () => string | null | undefined) {
	return async (url: RequestInfo | URL, options?: RequestInit) => {
		const requestKey = `${url.toString()}-${JSON.stringify(options?.body || '')}`;

		// Reuse pending requests to avoid duplicates
		if (pendingRequests.has(requestKey)) {
			return pendingRequests.get(requestKey)!.then(r => r.clone());
		}

		// Get the latest token
		const currentToken = getToken();
		const updatedOptions = { ...options };

		if (currentToken) {
			updatedOptions.headers = {
				...updatedOptions.headers,
				Authorization: `Bearer ${currentToken}`
			};
		}

		const fetchPromise = fetch(url, updatedOptions).then(async (response) => {
			// If we get a 401, try to refresh the token and retry the request
			if (response.status === 401 && currentToken) {
				// Check if we've refreshed recently
				const now = Date.now();

				if (!lastTokenRefreshTime.shouldRefresh(now)) {
					return response;
				}

				try {
					// Get the latest auth data from localStorage
					const authData = localStorage.getItem('auth');
					if (!authData) {
						throw new Error('Authentication required');
					}

					const auth = JSON.parse(authData);
					if (!auth.user?.id || !auth.refreshToken) {
						throw new Error('Invalid authentication data');
					}

					lastTokenRefreshTime.value = now; // Update last refresh time

					// Call refresh token API
					const result = await authApi.refreshToken(auth.user.id, auth.refreshToken);

					if (result && result.auth_token) {
						// Calculate new token expiry
						const newTokenExpiry = calculateTokenExpiry(result.auth_token);

						// Update auth in localStorage
						const updatedAuth = {
							...auth,
							authToken: result.auth_token,
							refreshToken: result.refresh_token || auth.refreshToken,
							tokenExpiry: newTokenExpiry,
							silentUpdate: true
						};

						try {
							localStorage.setItem('auth', JSON.stringify(updatedAuth));

							// Only dispatch event if we're not preventing re-renders
							if (!PREVENT_RERENDERS) {
								// Dispatch event to notify the app about the token refresh
								const event = new CustomEvent('auth:tokenRefreshed', {
									detail: {
										token: result.auth_token,
										refreshToken: result.refresh_token || auth.refreshToken,
										tokenExpiry: calculateTokenExpiry(result.auth_token),
										silentUpdate: true
									}
								});
								window.dispatchEvent(event);
							}
						} catch (storageError) {
							// Silent error handling
						}

						// Retry the original request with the new token
						const newOptions = {
							...options,
							headers: {
								...options?.headers,
								Authorization: `Bearer ${result.auth_token}`
							}
						};

						return fetch(url, newOptions);
					}
				} catch (refreshError) {
					// Silent error handling
				}
			}

			return response;
		});

		pendingRequests.set(requestKey, fetchPromise);

		try {
			return await fetchPromise;
		} finally {
			pendingRequests.delete(requestKey);
		}
	};
}