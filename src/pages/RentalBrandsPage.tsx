import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useLanguageStore } from '../store/languageStore';
import { BrandsPageSkeleton } from '../skeletons/BrandsPageSkeleton';

import { useRentProductBrands } from '../hooks/rent/useRentProductBrands';
import { useCurrentLocation } from '../context/LocationContext';

interface Service {
	id: string;
	service_name: string;
	image_url: string;
	backdrop_url: string;
	backdrop_blurhash: string;
	blurhash: string;
	poster2_url: string | null;
	poster2_blurhash: string;
	class: string;
	class_id: string;
	flexipay: string;
	flexipay_discount: string;
	flexipay_min: string;
}

const RentalBrandsPage = () => {
	const { classId } = useParams<{ classId: string }>();
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const [searchQuery, setSearchQuery] = useState('');

	const { location: globalLocation } = useCurrentLocation();
	const { data: rentalBrands, isLoading } = useRentProductBrands({ userId: user?.id || '', authToken: user?.auth_token || '', classId: classId || '', address: globalLocation });


	const filteredBrands = rentalBrands?.filter(brand => {
		return brand.service_name.toLowerCase().includes(searchQuery.toLowerCase());
	});

	return (
		<div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-6 space-y-4">
					<div className="flex items-center gap-3">
						<Link to="/" className="text-gray-400 hover:text-white transition-colors">
							<ArrowLeft className="h-6 w-6" />
						</Link>
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Brands</h1>
					</div>

					{/* Search Bar */}
					<div className="relative w-full">
						<input
							type="text"
							placeholder="Search brands..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="input pl-12 py-3 w-full rounded-2xl"
						/>
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
					</div>
				</div>

				{/* Services Grid */}
				{isLoading ? (
					<BrandsPageSkeleton
						showCategories={false}
						categoriesCount={0}
						brandsCount={12}
					/>
				) : !filteredBrands || filteredBrands.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-gray-400 text-lg">No Brands Found</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{filteredBrands.map((service) => (
							<Link
								to={`/products/${service.id}?section=offline_products`}
								key={service.id}
								className="bg-slate-800/30 rounded-lg overflow-hidden group hover:ring-2 hover:ring-slate-500 transition-all cursor-pointer"
							>
								<div className="relative aspect-square overflow-hidden">
									<img
										src={service.backdrop_url || service.image_url}
										alt={service.service_name}
										className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
									/>
									{service.flexipay === 't' && service.flexipay_discount !== '0' && (
										<div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-lg">
											{service.flexipay_discount}% {t('common.off')}
										</div>
									)}
								</div>
								<div className="p-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<h3 className="font-semibold text-sm mb-0.5 truncate">{service.service_name}</h3>
											<p className="text-[10px] text-gray-400 truncate">{service.class}</p>
										</div>
										<div className="flex-shrink-0">
											<img
												src={service.image_url}
												alt={`${service.service_name} logo`}
												className="w-9 h-9 rounded-md object-cover"
											/>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default RentalBrandsPage;
