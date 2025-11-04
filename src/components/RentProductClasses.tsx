import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import CategoriesSkeleton from '../skeletons/CategoriesSkeleton';

import { useRentProductClasses } from '../hooks/rent/useRentProductClasses';

import { useCurrentLocation } from '../context/LocationContext';

interface ServicePreview {
	id: string;
	image: string;
}


const RentProductClasses: React.FC = () => {
	const { user } = useAuthStore();
	const { t } = useLanguageStore();
	const navigate = useNavigate();

	const { location: globalLocation } = useCurrentLocation();

	const { data: productClasses, isLoading } = useRentProductClasses({ userId: user?.id, authToken: user?.auth_token, address: globalLocation });




	if (isLoading) {
		return (
			<section className="mb-12">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">Products</h2>
				</div>
				<CategoriesSkeleton count={8} />
			</section>
		);
	}

	if (!productClasses || productClasses?.length === 0) {
		return null;
	}

	return (
		<section className="mb-12">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold">Rent Products</h2>
			</div>
			<div className="relative">
				<div className="overflow-x-auto pb-4 hide-scrollbar">
					<div className="flex flex-col space-y-6 px-1" style={{ width: `${Math.ceil(productClasses?.length / 2) * (256 + 24)}px` }}>
						{/* First Row */}
						<div className="flex space-x-6">
							{productClasses?.filter((_, index) => index % 2 === 0).map((productClass) => (
								<div
									key={productClass.class_id}
									onClick={() => navigate(`/rental-brands/${productClass.class_id}`)}
									className="w-64 h-40 rounded-xl overflow-hidden group cursor-pointer relative transition-all duration-300 transform hover:scale-105"
									style={{
										backgroundImage: `url(${productClass.poster})`,
										backgroundSize: 'cover',
										backgroundPosition: 'center'
									}}
								>
									<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
									<div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />
									<div className="absolute inset-0 p-6 pt-4 flex flex-col justify-between">
										<div className="flex justify-end">
											<div className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-medium">
												{productClass.total_services_count}+ {t('explore.brands')}
											</div>
										</div>
										<div className="flex flex-col items-end">
											<h3 className="text-white font-bold text-lg mb-3">{productClass.class_name}</h3>
											<div className="flex -space-x-2">
												{productClass.services_preview.slice(0, 4).map((service) => (
													<div
														key={service.id}
														className="w-12 h-12 rounded-full border-2 border-dark-500 overflow-hidden bg-white shadow-lg transition-transform duration-200 hover:scale-110"
													>
														<img
															src={service.image}
															alt=""
															className="w-full h-full object-cover"
														/>
													</div>
												))}
												{productClass.total_services_count > 4 && (
													<div className="w-12 h-12 rounded-full border-2 border-dark-500 bg-white/90 backdrop-blur-sm flex items-center justify-center text-sm text-dark-900 font-bold shadow-lg">
														+{productClass.total_services_count - 4}
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Second Row */}
						<div className="flex space-x-6">
							{productClasses?.filter((_, index) => index % 2 === 1).map((productClass) => (
								<div
									key={productClass.class_id}
									onClick={() => navigate(`/rental-brands/${productClass.class_id}`)}
									className="w-64 h-40 rounded-xl overflow-hidden group cursor-pointer relative transition-all duration-300 transform hover:scale-105"
									style={{
										backgroundImage: `url(${productClass.poster})`,
										backgroundSize: 'cover',
										backgroundPosition: 'center'
									}}
								>
									<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
									<div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />
									<div className="absolute inset-0 p-6 pt-4 flex flex-col justify-between">
										<div className="flex justify-end">
											<div className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-medium">
												{productClass.total_services_count}+ {t('explore.brands')}
											</div>
										</div>
										<div className="flex flex-col items-end">
											<h3 className="text-white font-bold text-lg mb-3">{productClass.class_name}</h3>
											<div className="flex -space-x-2">
												{productClass.services_preview.slice(0, 4).map((service) => (
													<div
														key={service.id}
														className="w-12 h-12 rounded-full border-2 border-dark-500 overflow-hidden bg-white shadow-lg transition-transform duration-200 hover:scale-110"
													>
														<img
															src={service.image}
															alt=""
															className="w-full h-full object-cover"
														/>
													</div>
												))}
												{productClass.total_services_count > 4 && (
													<div className="w-12 h-12 rounded-full border-2 border-dark-500 bg-white/90 backdrop-blur-sm flex items-center justify-center text-sm text-dark-900 font-bold shadow-lg">
														+{productClass.total_services_count - 4}
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default RentProductClasses;
