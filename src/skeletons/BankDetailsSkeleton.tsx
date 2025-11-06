import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const BankDetailsSkeleton: React.FC = () => {
	return (
		<div>
			{/* Header */}
			<div className="mb-5 md:mb-6">
				<div className="flex items-center gap-2 mb-1.5 md:mb-2">
					<Skeleton circle width={20} height={20} />
					<Skeleton width={180} height={20} />
				</div>
				<Skeleton width={280} height={14} />
			</div>

			{/* Form Fields */}
			<div className="space-y-4 md:space-y-5 max-w-xl">
				{/* Account Holder Name */}
				<div>
					<Skeleton width={160} height={16} className="mb-1.5 md:mb-2" />
					<Skeleton height={42} className="rounded-lg" />
				</div>

				{/* Account Number */}
				<div>
					<Skeleton width={120} height={16} className="mb-1.5 md:mb-2" />
					<Skeleton height={42} className="rounded-lg" />
				</div>

				{/* IFSC Code */}
				<div>
					<Skeleton width={100} height={16} className="mb-1.5 md:mb-2" />
					<Skeleton height={42} className="rounded-lg" />
				</div>

				{/* Button */}
				<div className="pt-3 md:pt-4">
					<Skeleton width={180} height={40} className="rounded-lg" />
				</div>
			</div>
		</div>
	);
};

export default BankDetailsSkeleton;
