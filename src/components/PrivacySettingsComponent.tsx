import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const PrivacySettingsComponent = () => {
	const { user } = useAuthStore();
	const [hidePhoneNumber, setHidePhoneNumber] = useState(false);
	const [hideEmailId, setHideEmailId] = useState(false);
	const [isLoadingPrivacySettings, setIsLoadingPrivacySettings] = useState(false);
	const [privacySettingsError, setPrivacySettingsError] = useState<string | null>(null);

	const fetchPrivacySettings = useCallback(async () => {
		if (!user?.id || !user?.auth_token) return;

		setIsLoadingPrivacySettings(true);
		setPrivacySettingsError(null);
		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						query Query($user_id: uuid) {
							__typename
							whatsub_privacy_settings(where: {user_id: {_eq: $user_id}}) {
								__typename
								hide_phone_number
								hide_email_id
							}
						}
					`,
					variables: {
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setPrivacySettingsError('Failed to load privacy settings. Please try again.');
				return;
			}

			if (data.data?.whatsub_privacy_settings?.[0]) {
				const settings = data.data.whatsub_privacy_settings[0];
				setHidePhoneNumber(settings.hide_phone_number || false);
				setHideEmailId(settings.hide_email_id || false);
			}
		} catch (error) {
			console.error('Error fetching privacy settings:', error);
			setPrivacySettingsError('Failed to load privacy settings. Please check your connection and try again.');
		} finally {
			setIsLoadingPrivacySettings(false);
		}
	}, [user?.id, user?.auth_token]);

	// Fetch privacy settings when component mounts
	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchPrivacySettings();
		}
	}, [user?.id, user?.auth_token, fetchPrivacySettings]);

	const updatePrivacySetting = async (setting: 'hide_phone_number' | 'hide_email_id', value: boolean) => {
		if (!user?.id || !user?.auth_token) return;

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
						mutation UpdatePrivacySettings($user_id: uuid!, $hide_phone_number: Boolean, $hide_email_id: Boolean) {
							__typename
							insert_whatsub_privacy_settings(
								objects: {
									user_id: $user_id, 
									hide_phone_number: $hide_phone_number, 
									hide_email_id: $hide_email_id
								},
								on_conflict: {
									constraint: whatsub_privacy_settings_user_id_key,
									update_columns: [hide_phone_number, hide_email_id]
								}
							) {
								__typename
								affected_rows
							}
						}
					`,
					variables: {
						user_id: user.id,
						hide_phone_number: setting === 'hide_phone_number' ? value : hidePhoneNumber,
						hide_email_id: setting === 'hide_email_id' ? value : hideEmailId
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				console.error('Error updating privacy settings:', data.errors);
				// Revert the toggle if update failed
				if (setting === 'hide_phone_number') {
					setHidePhoneNumber(!value);
				} else {
					setHideEmailId(!value);
				}
			}
		} catch (error) {
			console.error('Error updating privacy settings:', error);
			// Revert the toggle if update failed
			if (setting === 'hide_phone_number') {
				setHidePhoneNumber(!value);
			} else {
				setHideEmailId(!value);
			}
		}
	};

	const handlePhoneNumberToggle = () => {
		const newValue = !hidePhoneNumber;
		setHidePhoneNumber(newValue);
		updatePrivacySetting('hide_phone_number', newValue);
	};

	const handleEmailToggle = () => {
		const newValue = !hideEmailId;
		setHideEmailId(newValue);
		updatePrivacySetting('hide_email_id', newValue);
	};

	return (
		<div>
			<h2 className="text-xl md:text-2xl font-bold mb-6">Privacy Settings</h2>
			{isLoadingPrivacySettings ? (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
					<p className="text-gray-400 mt-2">Loading privacy settings...</p>
				</div>
			) : privacySettingsError ? (
				<div className="text-center py-8">
					<div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-4">
						<p className="text-red-400 mb-4">{privacySettingsError}</p>
						<button
							onClick={fetchPrivacySettings}
							className="btn btn-primary"
						>
							Try Again
						</button>
					</div>
				</div>
			) : (
				<div className="space-y-6">
					{/* Hide Phone Number */}
					<div className="space-y-2">
						<h4 className="font-medium text-white text-lg">Hide Phone Number</h4>
						<p className="text-sm text-gray-400">When enabled, your phone number is hidden from others.</p>
						<div className="flex justify-end">
							<button
								onClick={handlePhoneNumberToggle}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${
									hidePhoneNumber ? 'bg-indigo-600' : 'bg-gray-600'
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										hidePhoneNumber ? 'translate-x-6' : 'translate-x-1'
									}`}
								/>
							</button>
						</div>
					</div>

					{/* Hide Email Id */}
					<div className="space-y-2">
						<h4 className="font-medium text-white text-lg">Hide Email Id</h4>
						<p className="text-sm text-gray-400">When enabled, your email is hidden from others.</p>
						<div className="flex justify-end">
							<button
								onClick={handleEmailToggle}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${
									hideEmailId ? 'bg-indigo-600' : 'bg-gray-600'
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										hideEmailId ? 'translate-x-6' : 'translate-x-1'
									}`}
								/>
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PrivacySettingsComponent;
