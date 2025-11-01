import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { handleSupportChat } from '../utils/supportChat';



const HelpSupportComponent: React.FC = () => {
	const { user } = useAuthStore();
	const [sections, setSections] = useState([]);
	const [currentSection, setCurrentSection] = useState(-1);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const navigate = useNavigate();

	useEffect(() => {
		if (user?.id && user?.auth_token) {
			fetchSupportData();
		}
	}, [user?.id, user?.auth_token]);

	const fetchSupportData = async (query: string = '') => {
		if (!user?.id || !user?.auth_token) return;

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
					query MyQuery($query: String!, $user_id: uuid!) {
						__typename
						w_supportSearch(request: { query: $query, user_id: $user_id }) {
							__typename
							sections
						}
					}
          `,
					variables: {
						query: query || 'help',
						user_id: user.id
					}
				})
			});

			const data = await response.json();

			if (data.errors) {
				setError('Failed to fetch support data');
				return;
			}

			const sections = data.data?.w_supportSearch?.sections;
			setSections(sections);

		} catch (error) {
			console.error('Error fetching support data:', error);
			setError('Failed to fetch support data');
		} finally {
			setIsLoading(false);
		}
	}


	const handleBlogClick = (url: string) => {
		window.open('https://blogs.subspace.money/blog/' + url);
	};

	const handleChatWithSupport = async () => {
		const roomId = await handleSupportChat(user?.id, user?.auth_token);

		console.log('roomid ', roomId);
		navigate('/chat?groupId=' + roomId);
	};



	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-3">
						<HelpCircle className="h-6 w-6 text-indigo-400" />
						Help and Support
					</h2>
					<p className="text-gray-400">Find answers to common questions</p>
				</div>
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
					<p className="text-red-400">{error}</p>
					<button
						onClick={() => fetchSupportData()}
						className="mt-4 btn btn-primary"
					>
						Try Again
					</button>
				</div>
			)}

			{/* Support Sections */}
			{!isLoading && !error && (
				<div className="space-y-4">

					{sections.map((section, index) => (
						<div key={index} className="bg-dark-400 rounded-xl overflow-hidden">
							<button
								onClick={() => {
									if (currentSection == index) {
										setCurrentSection(-1);
									} else {
										setCurrentSection(index)
									}
								}}
								className="w-full flex items-center justify-between p-6 text-left hover:bg-dark-300 transition-colors"
							>
								<h3 className="text-lg font-bold text-white">{section.title}</h3>
								{currentSection === index ? (
									<ChevronUp className="h-5 w-5 text-gray-400" />
								) : (
									<ChevronDown className="h-5 w-5 text-gray-400" />
								)}
							</button>

							{currentSection == index && (
								<div className="px-6 pb-6 border-t border-gray-600">
									<div className="space-y-4 pt-4">
										{section.coursex_topics.map(item => (
											<button
												key={item.id}
												className="block w-full text-left bg-dark-500 rounded-lg p-4"
												onClick={() => handleBlogClick(item.url)}
											>
												<h4 className="font-medium text-white mb-2">{item.title}</h4>
											</button>
										))}
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* Chat with Support Button */}
			<div className="sticky bottom-0 pt-6">
				<button
					onClick={handleChatWithSupport}
					className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-3"
				>
					<MessageSquare className="h-5 w-5" />
					Chat with us (9 AM - 6 PM)
				</button>
			</div>
		</div>
	);
};

export default HelpSupportComponent;