import {
	createBrowserRouter
} from 'react-router-dom';

import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

import AuthPage from '../pages/AuthPage';
import HomePage from '../pages/HomePage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import ProfilePage from '../pages/ProfilePage';
import WalletPage from '../pages/WalletPage';
import BrandsPage from '../pages/BrandsPage';
import ChatPage from '../pages/ChatPage2';
import CoinTransactionsPage from '../pages/CoinTransactionsPage';
import SubspaceGiftPage from '../pages/SubspaceGiftPage';
import ExplorePage from '../pages/ExplorePage';
import FriendsPage from '../pages/FriendsPage';
import PublicGroupsPage from '../pages/PublicGroupsPage';
import GroupsPage from '../pages/GroupsPage';
import NotFoundPage from '../pages/NotFoundPage';
import QuickPaymentsPage from '../pages/QuickPaymentsPage';
import TrendingSubscriptionsPage from '../pages/TrendingSubscriptionsPage';
import CheckoutPage from '../pages/CheckoutPage';
import MobileRechargePage from '../pages/MobileRechargePage';
import RechargePlansPage from '../pages/RechargePlansPage';
import DTHBillPage from '../pages/DTHBillPage';
import DTHPlansPage from '../pages/DTHPlansPage';
import FASTagRechargePage from '../pages/FASTagRechargePage';
import ElectricityBillPage from '../pages/ElectricityBillPage';
import PaymentsPage from '../pages/PaymentsPage';
import ServerErrorPage from '../pages/ServerErrorPage';
import SearchResultsPage from '../pages/SearchResultsPage';
import BlockedUserPage from '../pages/BlockedUserPage';
import SupportChatPage from '../pages/SupportChatPage';
import UserSubscriptionsPage from '../pages/UserSubscriptionsPage';
import RentalBrandsPage from '../pages/RentalBrandsPage';
import RentalCheckoutPage from '../pages/RentalCheckoutPage';



export const router = createBrowserRouter([
	{
		element: <Layout />,
		errorElement: <NotFoundPage />,
		children: [
			{ path: '/', element: <ExplorePage /> },
			{
				path: '/manage',
				element: (
					<ProtectedRoute>
						<HomePage />
					</ProtectedRoute>
				),
			},
			{ path: '/all-brands', element: <BrandsPage /> },
			{ path: '/rental-brands/:classId', element: <RentalBrandsPage /> },
			{ path: '/products/:id', element: <ProductDetailPage /> },
			{
				path: '/payment/:id',
				element: (
					<ProtectedRoute>
						<PaymentsPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/wallet',
				element: (
					<ProtectedRoute>
						<WalletPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/chat',
				element: (
					<ProtectedRoute>
						<ChatPage />
					</ProtectedRoute>
				),
			},
			{ path: '/public-groups', element: <PublicGroupsPage /> },
			{ path: '/groups/:planId', element: <GroupsPage /> },
			{
				path: '/coin-transactions',
				element: (
					<ProtectedRoute>
						<CoinTransactionsPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/subspace-gifts/:giftId',
				element: (
					<ProtectedRoute>
						<SubspaceGiftPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/cart',
				element: (
					<ProtectedRoute>
						<CartPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/profile',
				element: (
					<ProtectedRoute>
						<ProfilePage />
					</ProtectedRoute>
				),
			},
			{
				path: '/friends',
				element: (
					<ProtectedRoute>
						<FriendsPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/user-subscriptions',
				element: (
					<ProtectedRoute>
						<UserSubscriptionsPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/quick-payments',
				element: (
					<ProtectedRoute>
						<QuickPaymentsPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/trending-subscriptions',
				element: (
					<ProtectedRoute>
						<TrendingSubscriptionsPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/checkout/:roomId?',
				element: (
					<ProtectedRoute>
						<CheckoutPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/rental-checkout/:productId',
				element: (
					<ProtectedRoute>
						<RentalCheckoutPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/mobile-recharge',
				element: (
					<ProtectedRoute>
						<MobileRechargePage />
					</ProtectedRoute>
				),
			},
			{
				path: '/recharge-plans',
				element: (
					<ProtectedRoute>
						<RechargePlansPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/dth',
				element: (
					<ProtectedRoute>
						<DTHBillPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/dth-plans',
				element: (
					<ProtectedRoute>
						<DTHPlansPage />
					</ProtectedRoute>
				),
			},
			{
				path: '/fastag',
				element: (
					<ProtectedRoute>
						<FASTagRechargePage />
					</ProtectedRoute>
				),
			},
			{
				path: '/electricity',
				element: (
					<ProtectedRoute>
						<ElectricityBillPage />
					</ProtectedRoute>
				),
			},
			{ path: '/search', element: <SearchResultsPage /> },
		],
	},

	// Auth & Error Routes outside layout
	{ path: '/auth', element: <AuthPage /> },
	{ path: '/error', element: <ServerErrorPage /> },
	{ path: '/blocked', element: <BlockedUserPage /> },
	{ path: '/support', element: <SupportChatPage /> },
]);
