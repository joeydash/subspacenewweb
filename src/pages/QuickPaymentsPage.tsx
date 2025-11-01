import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CreditCard, Filter} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import QuickPaymentsSkeleton from '../skeletons/QuickPaymentsSkeleton';

interface BBPSOption {
  id: string;
  name: string;
  icon: string;
  blurhash: string;
  data: {
    args?: {
      brand_id?: string;
    };
    route: string;
  };
  type: string;
  discount_text: string | null;
}

interface BBPSClass {
  id: string;
  name: string;
  bbps_options: BBPSOption[];
}

interface BBPSData {
  bbps_class: BBPSClass[];
}

const QuickPaymentsPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const [bbpsData, setBbpsData] = useState<BBPSData>({ bbps_class: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (user?.id && user?.auth_token) {
      fetchBBPSOptions();
    }
  }, [user?.id, user?.auth_token]);

  const fetchBBPSOptions = async () => {
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
            query whatsubGetBBPSOptions($user_id: uuid!) {
              __typename
              whatsubGetBBPSOptions(request: {user_id: $user_id}) {
                __typename
                bbps_class {
                  __typename
                  id
                  name
                  bbps_options {
                    __typename
                    blurhash
                    icon
                    data
                    type
                    name
                    id
                    discount_text
                  }
                }
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
        setError('Failed to fetch payment options');
        return;
      }

      setBbpsData(data.data?.whatsubGetBBPSOptions || { bbps_class: [] });
    } catch (error) {
      console.error('Error fetching BBPS options:', error);
      setError('Failed to fetch payment options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option: BBPSOption) => {
    console.log('Option clicked:', option);
    
    try {
      let data;
      if (typeof option.data === 'string') {
        try {
          data = JSON.parse(option.data);
        } catch (parseError) {
          console.error('Error parsing option data:', parseError);
          return;
        }
      } else {
        data = option.data;
      }
      
      // Handle brand navigation (for FlexiPay services)
      if (option?.data?.args?.brand_id) {
		  let route;

		  switch (option.data?.route) {
			  case 'brand':
				  route = 'products';
				  break;
			  default:
				  route = 'payments'

		  }

		  navigate(`/${route}/${option?.data?.args.brand_id}`);
      }
      // Handle specific route navigation
      else if (data?.route) {
        const route = data.route;
        
        // Map specific routes to their pages
        switch (route) {
          case 'mobile-recharge':
            navigate('/mobile-recharge');
            break;
          case 'dth':
            navigate('/dth');
            break;
          case 'electricity':
            navigate('/electricity');
            break;
          case 'fastag':
            navigate('/fastag');
            break;
          case 'gas':
            navigate('/gas');
            break;
          case 'water':
            navigate('/water');
            break;
          case 'broadband':
            navigate('/broadband');
            break;
          case 'landline':
            navigate('/landline');
            break;
          case 'insurance':
            navigate('/insurance');
            break;
          case 'loan':
            navigate('/loan');
            break;
          case 'credit_card':
            navigate('/credit-card');
            break;
          case 'municipal_tax':
            navigate('/municipal-tax');
            break;
          case 'education':
            navigate('/education');
            break;
          case 'hospital':
            navigate('/hospital');
            break;
          case 'subscription':
            navigate('/subscription');
            break;
          case 'donation':
            navigate('/donation');
            break;
          case 'housing_society':
            navigate('/housing-society');
            break;
          case 'cable_tv':
            navigate('/cable-tv');
            break;
          case 'metro_card':
            navigate('/metro-card');
            break;
          case 'municipal_services':
            navigate('/municipal-services');
            break;
          case 'clubs_associations':
            navigate('/clubs-associations');
            break;
          default:
            // For unknown routes, try navigating to the route directly
            navigate(`/${route}`);
            break;
        }
      }
      // Handle URL navigation (external links)
      else if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
      // Fallback: if no specific routing found, show a message
      else {
        console.log('No navigation action available for this option');
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error handling option click:', error);
    }
  };

  const getAllOptions = () => {
    return bbpsData.bbps_class.flatMap(category => 
      category.bbps_options.map(option => ({
        ...option,
        categoryName: category.name
      }))
    );
  };

  const getFilteredOptions = () => {
    const allOptions = getAllOptions();
    
    let filtered = allOptions;
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(option => option.categoryName === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(option =>
        option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getCategories = () => {
    return ['All', ...bbpsData.bbps_class.map(category => category.name)];
  };

  return (
    <div className="page-container pt-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/manage" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-indigo-400" />
            {t('quickPayments.title')}
          </h1>
          <p className="text-gray-400">{t('quickPayments.subtitle')}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-2xl">
            <input
              type="text"
              placeholder={t('quickPayments.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 py-3 text-lg w-full"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-400 hidden sm:inline">{t('quickPayments.category')}:</span>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {getCategories().map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-indigo-500 text-white'
                      : 'bg-dark-400 text-gray-400 hover:bg-dark-300'
                  }`}
                >
                  {category === 'All' ? t('common.all') : t(`quickPayments.${category.replace(/\s+/g, "").replace(/^./, c => c.toLowerCase())}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
      <QuickPaymentsSkeleton categories={2} itemsPerCategory={4} />
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {selectedCategory === 'All' ? (
            /* Category-wise Display */
            <div className="space-y-8">
              {bbpsData.bbps_class.map((category) => {
                const filteredOptions = category.bbps_options.filter(option =>
                  !searchQuery || option.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                if (filteredOptions.length === 0) return null;
                
                return (
                  <div key={category.id}>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-indigo-400" />
                      </div>
                      {category.name}
                      <span className="text-sm font-normal text-gray-400">({filteredOptions.length})</span>
                    </h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleOptionClick(option)}
                          className="bg-dark-500 rounded-xl p-4 hover:bg-dark-400 transition-all duration-300 border border-gray-700/50 hover:border-indigo-500/50 group text-center"
                        >
                          <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden bg-transparent p-1 group-hover:scale-105 transition-transform">
                            <img
                              src={option.icon}
                              alt={option.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <h3 className="font-medium text-sm mb-2 group-hover:text-indigo-400 transition-colors">
                            {option.name}
                          </h3>
                          {option.discount_text && (
                            <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                              {option.discount_text}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Filtered Display */
            <div>
              <h2 className="text-2xl font-bold mb-6">
                {selectedCategory} ({getFilteredOptions().length})
              </h2>
              
              {getFilteredOptions().length === 0 ? (
                <div className="bg-dark-500 rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t('quickPayments.noOptionsFound')}</h3>
                  <p className="text-gray-400">
                    {searchQuery 
                      ? `${t('quickPayment.noPaymentOptionFound')} "${searchQuery}" ${t('quickPayments.in')} ${selectedCategory}`
                      : `{t('quickPayments.nopaymentOption')} ${selectedCategory}`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {getFilteredOptions().map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option)}
                      className="bg-dark-500 rounded-xl p-4 hover:bg-dark-400 transition-all duration-300 border border-gray-700/50 hover:border-indigo-500/50 group text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden bg-transparent p-1 group-hover:scale-105 transition-transform">
                        <img
                          src={option.icon}
                          alt={option.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <h3 className="font-medium text-sm mb-2 group-hover:text-indigo-400 transition-colors">
                        {option.name}
                      </h3>
                      {option.discount_text && (
                        <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                          {option.discount_text}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuickPaymentsPage;