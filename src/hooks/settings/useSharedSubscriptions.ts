import { useQuery } from '@tanstack/react-query';
import { fetchSharedSubscriptions } from '../../api/settings';

export const SHARED_SUBSCRIPTIONS_BASE_KEY = 'shared_subscriptions';

interface SharedSubscription {
	subscription_id: string;
	is_public: boolean;
	subscription: {
		name: string;
		brand: {
			logo: string;
		};
	};
}

interface UseSharedSubscriptionsParams {
	authToken: string | undefined;
	userId: string | undefined;
}

export const useSharedSubscriptions = ({ authToken, userId }: UseSharedSubscriptionsParams) => {
	return useQuery<SharedSubscription[], Error>({
		queryKey: [SHARED_SUBSCRIPTIONS_BASE_KEY, userId],
		queryFn: ({ signal }) => fetchSharedSubscriptions({ authToken: authToken!, userId: userId!, signal }),
		enabled: !!authToken && !!userId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};
