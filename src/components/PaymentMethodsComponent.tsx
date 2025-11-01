import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { useBankDetails } from '../hooks/payment/useBankDetails';
import { useVerifyBankDetails } from '../hooks/payment/useVerifyBankDetails';
import type { BankDetails } from '../api/payment';

const PaymentMethodsComponent = () => {
	const { user } = useAuthStore();

	const {
		data: fetchedBankDetails,
		isLoading: isLoadingBankDetails,
		error: bankDetailsError,
		refetch: refetchBankDetails,
	} = useBankDetails(user?.id, user?.auth_token);

	const { mutate: verifyBankDetailsMutation, isPending: isVerifying } = useVerifyBankDetails();

	const [bankDetails, setBankDetails] = useState<BankDetails>({
		accountName: '',
		accountNumber: '',
		ifsc: '',
		isVerified: false,
	});

	// Sync fetched bank details with local state
	useEffect(() => {
		if (fetchedBankDetails) {
			setBankDetails(fetchedBankDetails);
		}
	}, [fetchedBankDetails]);


	const hasChangedBankDetails = () => {
		if (!fetchedBankDetails) return false;
		return (
			bankDetails.accountNumber !== fetchedBankDetails.accountNumber ||
			bankDetails.ifsc !== fetchedBankDetails.ifsc
		);
	};

	const canVerifyBankDetails = () => {
		// Both account number and IFSC must be provided
		if (!bankDetails.accountNumber || !bankDetails.ifsc) {
			return false;
		}
		// Must have changes from original to enable verification
		return hasChangedBankDetails();
	};

	const verifyBankDetails = () => {
		if (!bankDetails.accountNumber || !bankDetails.ifsc) {
			toast.error('Please fill in all bank details');
			return;
		}

		if (!user?.id || !user?.auth_token) {
			toast.error('User not authenticated');
			return;
		}

		verifyBankDetailsMutation(
			{
				userId: user.id,
				authToken: user.auth_token,
				accountNumber: bankDetails.accountNumber,
				ifsc: bankDetails.ifsc,
			},
			{
				onSuccess: (data) => {
					toast.success(data.message || 'Bank details verified and saved successfully');
				},
				onError: (error) => {
					toast.error(error instanceof Error ? error.message : 'Verification failed. Please try again.');
				},
			}
		);
	};

	return (
		<div className="w-full max-w-3xl">
			{isLoadingBankDetails ? (
				<div className="text-center py-8 md:py-12">
					<div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
					<p className="text-gray-400 mt-3 md:mt-4 text-sm md:text-base">Loading payment details...</p>
				</div>
			) : bankDetailsError ? (
				<div className="text-center py-8 md:py-12">
					<div className="bg-red-900/20 border border-red-500/50 rounded-lg md:rounded-xl p-4 md:p-6 max-w-md mx-auto">
						<svg className="w-10 h-10 md:w-12 md:h-12 text-red-400 mx-auto mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p className="text-red-400 mb-3 md:mb-4 text-sm md:text-base">
							{bankDetailsError instanceof Error ? bankDetailsError.message : 'Failed to load payment details. Please try again.'}
						</p>
						<button
							onClick={() => refetchBankDetails()}
							className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base"
						>
							Try Again
						</button>
					</div>
				</div>
			) : (
				<div>
					{/* Bank Details Form */}
					<div>
						<div className="mb-5 md:mb-6">
							<h3 className="text-base md:text-lg font-semibold text-white mb-1.5 md:mb-2 flex items-center gap-2">
								<svg className="w-4 h-4 md:w-5 md:h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
								</svg>
								<span>Bank Account Details</span>
							</h3>
							<p className="text-gray-400 text-xs md:text-sm">Enter your bank account information for withdrawals</p>
						</div>

						<div className="space-y-4 md:space-y-5 max-w-xl">
							{bankDetails?.accountName && (
								<div>
									<label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
										Account Holder Name
									</label>
									<div className="relative">
										<input
											type="text"
											value={bankDetails.accountName}
											readOnly
											className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-white cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
											placeholder="Account holder name"
										/>
										<svg className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
								</div>
							)}

							<div>
								<label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
									Account Number
								</label>
								<input
									type="text"
									value={bankDetails.accountNumber}
									onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
									className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
									placeholder="Enter your account number"
								/>
							</div>

							<div>
								<label className="block text-xs md:text-sm font-medium text-gray-300 mb-1.5 md:mb-2">
									IFSC Code
								</label>
								<input
									type="text"
									value={bankDetails.ifsc}
									onChange={(e) => setBankDetails(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
									className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase"
									placeholder="Enter IFSC code (e.g., SBIN0001234)"
								/>
							</div>

							<div className="pt-3 md:pt-4">
								<button
									onClick={verifyBankDetails}
									disabled={isVerifying || !canVerifyBankDetails()}
									className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
								>
									{isVerifying ? (
										<>
											<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											<span>Verifying...</span>
										</>
									) : (
										<>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span>Verify Bank Details</span>
										</>
									)}
								</button>
								{bankDetails.accountNumber && bankDetails.ifsc && !hasChangedBankDetails() && (
									<p className="text-gray-400 text-xs md:text-sm mt-2">
										{bankDetails.isVerified ? '✓ Bank details are already verified' : 'No changes to verify'}
									</p>
								)}
							</div>
						</div>

						{bankDetails.isVerified && (
							<div className="mt-5 md:mt-6 bg-green-900/20 border border-green-500/30 rounded-lg p-3 md:p-4 flex items-start gap-2.5 md:gap-3">
								<svg className="w-5 h-5 md:w-6 md:h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<div>
									<h4 className="text-green-300 font-medium text-xs md:text-sm">Verified Account</h4>
									<p className="text-green-400/80 text-xs md:text-sm mt-0.5 md:mt-1">
										Your bank account has been successfully verified and is ready to receive payouts.
									</p>
								</div>
							</div>
						)}
					</div>
						</div>
					)}
		</div>
	);
};

export default PaymentMethodsComponent;
