import { useState, useEffect } from 'react';
import { User, Package, CreditCard, LogOut, Users, Settings, PiggyBank, BookOpen, Mail, BadgeInfo, Star, Info, Clock, Menu, X, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, fetchUserInfo } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import ProfileTabContent from '../components/ProfileTabContent';
import SettingsComponent from '../components/SettingsComponent.backup';
import MoneySaved from '../components/MoneySaved';
import BlogsComponent from '../components/BlogsComponent';
import MailboxComponent from '../components/MailboxComponent';
import HelpSupportComponent from '../components/HelpSupportComponent';
import AppInfoComponent from '../components/AppInfoComponent';
import OrderHistoryComponent from '../components/OrderHistoryComponent';
import AddressesComponent from '../components/AddressesComponent';
import RentalHistoryComponent from '../components/RentalHistoryComponent';
import PaymentMethodsComponent from '../components/PaymentMethodsComponent';
import { useSearchParams } from 'react-router-dom';


const ProfilePage = () => {
	const { user, logout } = useAuthStore();
	const { t } = useLanguageStore();
	const [activeTab, setActiveTab] = useState('profile');
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const navigate = useNavigate();

	const [profileData, setProfileData] = useState({
		fullname: user?.fullname || user?.name || '',
		email: user?.email || '',
		username: user?.username || '',
		dp: user?.dp || ''
	});

	useEffect(() => {
		if (user?.id) {
			fetchUserInfo(user.id).then(info => {
				if (info) {
					setProfileData({
						fullname: info.fullname || '',
						email: info.email || '',
						username: info.username || '',
						dp: info.dp || ''
					});
				}
			});
		}
	}, [user?.id]);

	// Update profileData when user data changes (including dp)
	useEffect(() => {
		if (user) {
			setProfileData(prev => ({
				...prev,
				fullname: user.fullname || user.name || '',
				email: user.email || '',
				username: user.username || '',
				dp: user.dp || ''
			}));
		}
	}, [user?.dp, user?.fullname, user?.email, user?.username]);

	const [searchParams, setSearchParams] = useSearchParams();
	const currentTab = searchParams.get('tab');

	const handleLogout = () => {
		logout();
		navigate('/', { replace: true })
	};

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	const closeSidebar = () => {
		setIsSidebarOpen(false);
	};

	// Close sidebar when tab changes on mobile
	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
		setIsSidebarOpen(false);
	};

	// Prevent body scroll when sidebar is open on mobile
	useEffect(() => {
		if (isSidebarOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isSidebarOpen]);

	useEffect(() => {
		if (currentTab) {
			setSearchParams(prevParams => {
				const newParams = new URLSearchParams(prevParams);
				newParams.delete('tab');
				return newParams;
			});
			setActiveTab(currentTab);
		}
	}, [currentTab, setSearchParams]);

	if (currentTab) {
		return null;
	}

	return (
		<div className="max-w-[2000px] mx-auto pt-20 md:pt-12">
			{/* Mobile Header with Toggle */}
			<div className="md:hidden flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<button
						onClick={toggleSidebar}
						className="p-2 text-gray-400 hover:text-white hover:bg-dark-400 rounded-lg transition-colors"
					>
						<Menu className="h-6 w-6" />
					</button>
					<h1 className="text-2xl font-bold">{t('nav.profile')}</h1>
				</div>
			</div>

			{/* Mobile Sidebar Overlay */}
			{isSidebarOpen && (
				<div
					className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
					onClick={closeSidebar}
				/>
			)}

			<div className="max-w-[1800px] mx-auto flex flex-col md:flex-row gap-0">
				{/* Sidebar */}
				<div className="order-2 md:order-1 md:w-[280px] flex-shrink-0">
					<div className={`md:static md:transform-none md:transition-none fixed top-0 left-0 h-full w-full z-50 transition-transform duration-300 ease-in-out rounded-lg md:rounded-none flex flex-col ${isSidebarOpen ? 'bg-dark-400 transform translate-x-0' : 'transform -translate-x-full'
						} md:translate-x-0`}>
						{/* Mobile Close Button */}
						<div className="md:hidden flex items-center justify-between p-6 pb-4 flex-shrink-0">
							<h2 className="text-xl font-bold">{t('nav.profile')}</h2>
							<button
								onClick={closeSidebar}
								className="p-2 text-gray-400 hover:text-white hover:bg-dark-400 rounded-lg transition-colors"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="flex items-center px-6 pb-6 flex-shrink-0">
							<div className="bg-indigo-900 rounded-full overflow-hidden mr-4 w-12 h-12 flex items-center justify-center">
								{profileData.dp ? (
									<img
										src={profileData.dp}
										alt="Display Picture"
										className="w-full h-full rounded-full object-cover"
									/>
								) : (
									<User className="h-6 w-6 text-indigo-400" />
								)}
							</div>

							<div>
								<h2 className="font-bold">{profileData.fullname || 'User'}</h2>
								<p className="text-gray-400 text-sm">{user?.phone}</p>
							</div>
						</div>

						<div className="space-y-1 px-6 pb-6 overflow-y-auto flex-1 small-scrollbar">
							<button
								onClick={() => handleTabChange('profile')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'profile' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<User className="h-5 w-5 mr-3" />
								{t('nav.profile')}
							</button>
							<button
								onClick={() => handleTabChange('payment')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'payment' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<CreditCard className="h-5 w-5 mr-3" />
								Payout Methods
							</button>
							<button
								onClick={() => handleTabChange('addresses')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'addresses' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<MapPin className="h-5 w-5 mr-3" />
								My Addresses
							</button>
							<button
								onClick={() => handleTabChange('order-history')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'order-history' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Clock className="h-5 w-5 mr-3" />
								Order History
							</button>
							<button
								onClick={() => handleTabChange('rental-history')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'rental-history' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Package className="h-5 w-5 mr-3" />
								Rental History
							</button>
							<Link
								to="/friends"
								className="w-full text-left px-4 py-2 rounded-full text-gray-400 hover:bg-dark-400 hover:text-white flex items-center"
							>
								<Users className="h-5 w-5 mr-3" />
								{t('nav.friends')}
							</Link>
							<button
								onClick={() => handleTabChange('settings')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'settings' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Settings className="h-5 w-5 mr-3" />
								Settings
							</button>
							<button
								onClick={() => handleTabChange('money-saved')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'money-saved' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<PiggyBank className="h-5 w-5 mr-3" />
								Money Saved
							</button>
							<button
								onClick={() => handleTabChange('blogs')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'blogs' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<BookOpen className="h-5 w-5 mr-3" />
								Blogs and Articles
							</button>
							<button
								onClick={() => handleTabChange('mailbox')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'mailbox' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Mail className="h-5 w-5 mr-3" />
								AI-powered Mailbox
							</button>
							<button
								onClick={() => handleTabChange('help')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'help' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<BadgeInfo className="h-5 w-5 mr-3" />
								Help And Support
							</button>
							<button
								onClick={() => window.open('https://play.google.com/store/apps/details?id=org.grow90.whatsub')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'review' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Star className="h-5 w-5 mr-3" />
								Review Us
							</button>
							<button
								onClick={() => handleTabChange('app-info')}
								className={`w-full text-left px-4 py-2 rounded-full flex items-center ${activeTab === 'app-info' ? 'bg-dark-400 text-white' : 'text-gray-400 hover:bg-dark-400 hover:text-white'
									}`}
							>
								<Info className="h-5 w-5 mr-3" />
								App Info
							</button>
							<button
								onClick={handleLogout}
								className="w-full text-left px-4 py-2 rounded-full text-red-500 hover:bg-red-900 hover:bg-opacity-20 flex items-center"
							>
								<LogOut className="h-5 w-5 mr-3" />
								Log Out
							</button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="order-1 md:order-3 flex-1 min-w-0 md:pl-8">
					<div className="rounded-lg overflow-hidden md:mt-0">
						<div className="max-sm:max-h-[800px] sm:h-[800px] overflow-y-auto small-scrollbar max-sm:p-2 sm:px-2">
							{activeTab === 'profile' && (
								<ProfileTabContent />
							)}

							{activeTab === 'payment' && (
								<PaymentMethodsComponent />
							)}

							{activeTab === 'addresses' && (
								<AddressesComponent />
							)}

							{activeTab === 'order-history' && (
								<OrderHistoryComponent />
							)}

							{activeTab === 'rental-history' && (
								<RentalHistoryComponent />
							)}

							{activeTab === 'settings' && (
								<SettingsComponent />
							)}

							{activeTab === 'money-saved' && (
								<MoneySaved />
							)}

							{activeTab === 'blogs' && (
								<BlogsComponent />
							)}

							{activeTab === 'mailbox' && (
								<MailboxComponent />
							)}

							{activeTab === 'help' && (
								<HelpSupportComponent />
							)}

							{activeTab === 'app-info' && (
								<AppInfoComponent />
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProfilePage;