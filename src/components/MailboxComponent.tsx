import React, { useState, useEffect } from 'react';
import { Mail, Shield, Users, MessageSquare, Copy, CheckCircle, Play, Video, RefreshCw } from 'lucide-react';
import { Player, Controls } from '@lottiefiles/react-lottie-player';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';


interface HelpWidgetData {
	title: string;
	details: string;
	anim_url: string;
	type: string;
	data: any;
}

const MailboxComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [copied, setCopied] = useState(false);
	const [helpWidgetData, setHelpWidgetData] = useState<HelpWidgetData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [animationError, setAnimationError] = useState(false);

	const subspaceMail = user?.phone + '@rylo.club';

	useEffect(() => {
		if (user?.auth_token) {
			fetchHelpWidgetDetails();
		}
	}, [user?.auth_token]);

	const fetchHelpWidgetDetails = async () => {
		if (!user?.auth_token) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch('https://db.subspace.money/v1/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${user.auth_token}`
				},
				body: JSON.stringify({
					query: `
            query GetHelpWidgetDetails($key: String) {
              __typename
              whatsub_help_widget(where: { key: { _eq: $key } }) {
                __typename
                title
                details
                anim_url
                type
                data
              }
            }
          `,
					variables: {
						key: "mailbox"
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to fetch mailbox details');
				return;
			}

			const widgetData = data.data?.whatsub_help_widget?.[0];
			if (widgetData) {
				setHelpWidgetData(widgetData);
			} else {
				setError('No mailbox data found');
			}
		} catch (error) {
			console.error('Error fetching help widget details:', error);
			setError('Failed to fetch mailbox details');
		} finally {
			setIsLoading(false);
		}
	};

	const handleRefresh = () => {
		fetchHelpWidgetDetails();
	};

	const handleCopyEmail = async () => {
		if (!subspaceMail) return;

		try {
			await navigator.clipboard.writeText(subspaceMail);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy email:', error);
		}
	};

	const handleTutorialClick = () => {
		const url = helpWidgetData?.data?.url
		window.open('https://www.youtube.com/watch?v=' + url);
	};



	

	if (isLoading) {
		return (
			<div className="space-y-8">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-3">
							<Mail className="h-6 w-6 text-indigo-400" />
							AI-powered Mailbox
						</h2>
						<p className="text-gray-400">Smart email filtering and management</p>
					</div>
					<div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
				</div>
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-8">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-3">
							<Mail className="h-6 w-6 text-indigo-400" />
							AI-powered Mailbox
						</h2>
						<p className="text-gray-400">Smart email filtering and management</p>
					</div>
					<button
						onClick={handleRefresh}
						className="p-2 text-gray-400 hover:text-white hover:bg-dark-400 rounded-lg transition-colors"
					>
						<RefreshCw className="h-5 w-5" />
					</button>
				</div>
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
					<p className="text-red-400">{error}</p>
					<button
						onClick={handleRefresh}
						className="mt-4 btn btn-primary"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-3">
						<Mail className="h-6 w-6 text-indigo-400" />
						{helpWidgetData?.title || 'AI-powered Mailbox'}
					</h2>
					<p className="text-gray-400">Smart email filtering and management</p>
				</div>
			</div>

			{/* Mail Animation */}
				<div className="flex justify-center">
				<div className="w-full max-w-36 aspect-square rounded-2xl overflow-hidden bg-dark-400">
					<Player
						autoplay
						loop
						src="/mail-animation.json"
						style={{ height: '120px', width: '120px' }}
					/>
					
				</div>
			</div>

			{/* Features List */}
			<div className="space-y-4">
				<div className="flex items-center gap-4 p-4 bg-dark-400/50 rounded-lg">
					<div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
						<Shield className="h-4 w-4 text-green-400" />
					</div>
					<div>
						<h3 className="font-medium text-white">99% effective in blocking marketing and spam.</h3>
					</div>
				</div>

				<div className="flex items-center gap-4 p-4 bg-dark-400/50 rounded-lg">
					<div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
						<Users className="h-4 w-4 text-blue-400" />
					</div>
					<div>
						<h3 className="font-medium text-white">Only permitting transactional emails.</h3>
					</div>
				</div>

				<div className="flex items-center gap-4 p-4 bg-dark-400/50 rounded-lg">
					<div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
						<MessageSquare className="h-4 w-4 text-purple-400" />
					</div>
					<div>
						<h3 className="font-medium text-white">Your mail will arrive in the group chat.</h3>
					</div>
				</div>
			</div>

			{/* Tutorial Section */}
			<div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-6">
				<div className="flex items-center justify-between gap-4">
					<div>
						<h3 className="text-lg font-bold text-white mb-2">
							{helpWidgetData?.type === 'tutorial' ? helpWidgetData.title : 'How to use Subspace Mail?'}
						</h3>
						<p className="text-yellow-400 text-sm">
							Takes a minute to understand how it works.
						</p>
					</div>
					<button
						onClick={handleTutorialClick}
						className="size-18 flex items-center justify-center bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-colors flex-shrink-0"
					>
						<Player
							autoplay
							loop
							src={helpWidgetData?.anim_url}
							style={{ height: '48px', width: '48px' }}
						/>
					</button>
				</div>
			</div>

			{/* Email Address Section */}
			<div className="border-2 border-dashed border-gray-600 rounded-xl p-6">
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<div className="font-mono text-xl text-indigo-400 break-all">
							{subspaceMail}
						</div>
					</div>
					<button
						onClick={handleCopyEmail}
						disabled={!subspaceMail}
						className={`ml-4 p-3 rounded-lg transition-all duration-200 ${copied
							? 'bg-green-500/20 text-green-400 border border-green-500/30'
							: 'bg-dark-400 hover:bg-dark-300 text-gray-400 hover:text-white border border-gray-600'
							}`}
					>
						{copied ? (
							<CheckCircle className="h-5 w-5" />
						) : (
							<Copy className="h-5 w-5" />
						)}
					</button>
				</div>

				{copied && (
					<div className="mt-3 text-sm text-green-400 flex items-center gap-2">
						<CheckCircle className="h-4 w-4" />
						Email address copied to clipboard!
					</div>
				)}
			</div>
		</div>
	);
};

export default MailboxComponent;