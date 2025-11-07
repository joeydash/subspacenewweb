import React, { useState } from 'react';
import { Share2, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSharedSubscriptions } from '../../hooks/settings/useSharedSubscriptions';
import { useUpdateSubscriptionPublicStatus } from '../../hooks/settings/useUpdateSubscriptionPublicStatus';

const SharedSubscriptionsComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [isExpanded, setIsExpanded] = useState(false);

	const { data: subscriptions = [], isLoading: isLoadingSubscriptions, error: subscriptionsError } = useSharedSubscriptions({
		authToken: user?.auth_token,
		userId: user?.id
	});

	const updateSubscriptionMutation = useUpdateSubscriptionPublicStatus({
		userId: user?.id || '',
		authToken: user?.auth_token || ''
	});

	const handleSubscriptionToggle = (subscriptionId: string, currentIsPublic: boolean) => {
		updateSubscriptionMutation.mutate({
			subscriptionId,
			isPublic: !currentIsPublic
		});
	};

	return (
		<>
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
			>
				<div className="flex items-center gap-3">
					<Share2 className="h-5 w-5 text-gray-400 group-hover:text-white" />
					<span className="font-medium">Shared Subscriptions</span>
				</div>
				{isExpanded ? (
					<ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
				) : (
					<ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
				)}
			</button>
			{isExpanded && (
				isLoadingSubscriptions ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
						<p className="text-gray-400 mt-2">Loading subscriptions...</p>
					</div>
				) : (
					<div>
						<p className="text-sm text-gray-400 mb-4">
							Subscriptions with toggle 'ON' are public and will be shown in the marketplace. Private subscriptions are only visible to you.
						</p>

						{subscriptionsError ? (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
								<p className="text-red-400 text-sm">{subscriptionsError.message || 'Failed to load subscriptions'}</p>
							</div>
						) : subscriptions.length === 0 ? (
							<div className="bg-dark-400 rounded-lg p-6 text-center">
								<Share2 className="h-8 w-8 text-gray-500 mx-auto mb-2" />
								<p className="text-gray-400 text-sm">No active subscriptions found</p>
							</div>
						) : (
							<div className="bg-dark-400 rounded-lg p-4 max-h-80 overflow-y-scroll hide-scrollbar">
								<div className="space-y-3">
									{subscriptions.map((subscription) => (
										<div key={subscription.subscription_id} className="flex items-center gap-3 p-4 bg-dark-500 rounded-lg">
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<div className="w-12 h-12 rounded-lg overflow-hidden bg-white p-1 flex-shrink-0">
													<img
														src={subscription.subscription.brand.logo}
														alt={subscription.subscription.name}
														className="w-full h-full object-contain"
													/>
												</div>
												<div className="flex-1 min-w-0 overflow-hidden">
													<h5 className="font-medium text-white text-sm sm:text-base truncate leading-tight">
														{subscription.subscription.name}
													</h5>
												</div>
											</div>
											<div className="flex-shrink-0 ml-2">
												<button
													onClick={() => handleSubscriptionToggle(subscription.subscription_id, subscription.is_public)}
													className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${subscription.is_public ? 'bg-indigo-600' : 'bg-gray-600'}`}
												>
													<span
														className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${subscription.is_public ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'}`}
													/>
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)
			)}
		</>
	);
};

export default SharedSubscriptionsComponent;
