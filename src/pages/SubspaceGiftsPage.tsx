import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Coins, Trophy, Star, Clock, CheckCircle, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ScratchCard from '../components/ScratchCard';

interface Gift {
  id: string;
  is_claimed: boolean;
  win_image: string;
  win_text: string;
  value: number;
  type: string;
}

interface CoinsTotal {
  total: number;
}

const SubspaceGiftsPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [coinsTotal, setCoinsTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scratchingGifts, setScratchingGifts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id && user?.auth_token) {
      fetchGiftsData();
    }
  }, [user?.id, user?.auth_token]);

  const fetchGiftsData = async () => {
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
            query MyQuery($user_id: uuid) {
              __typename
              whatsub_coins_total(where: {user_id: {_eq: $user_id}}) {
                __typename
                total
              }
              whatsub_gifts(where: {user_id: {_eq: $user_id}}, order_by: {created_at: desc}) {
                __typename
                id
                is_claimed
                win_image
                win_text
                value
                type
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
        setError('Failed to fetch gifts data');
        return;
      }

      setGifts(data.data?.whatsub_gifts || []);
      setCoinsTotal(data.data?.whatsub_coins_total?.[0]?.total || 0);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      setError('Failed to fetch gifts data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScratchComplete = async (giftId: string) => {
    if (!user?.id || !user?.auth_token) return;
    
    setScratchingGifts(prev => new Set(prev).add(giftId));
    
    try {
      // Here you would typically call an API to claim the gift
      // For now, we'll simulate the API call and update the local state
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the gift as claimed in local state
      setGifts(prevGifts => 
        prevGifts.map(gift => 
          gift.id === giftId 
            ? { ...gift, is_claimed: true }
            : gift
        )
      );
      
      // Refresh the entire gifts data to get updated coins total
      await fetchGiftsData();
      
    } catch (error) {
      console.error('Error claiming gift:', error);
      // Handle error - maybe show a toast notification
    } finally {
      setScratchingGifts(prev => {
        const next = new Set(prev);
        next.delete(giftId);
        return next;
      });
    }
  };

  const getGiftIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'coins':
        return <Coins className="h-6 w-6 text-yellow-400" />;
      case 'trophy':
        return <Trophy className="h-6 w-6 text-yellow-400" />;
      case 'star':
        return <Star className="h-6 w-6 text-yellow-400" />;
      default:
        return <Gift className="h-6 w-6 text-yellow-400" />;
    }
  };

  const getGiftTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'coins':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'trophy':
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
      case 'star':
        return 'from-blue-500/20 to-indigo-500/20 border-blue-500/30';
      default:
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
    }
  };

  const claimedGifts = gifts.filter(gift => gift.is_claimed);
  const unclaimedGifts = gifts.filter(gift => !gift.is_claimed);

  return (
    <div className="page-container pt-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-400 rounded-lg">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Subspace Gifts
          </h1>
          <p className="text-gray-400">Your rewards and achievements</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
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
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Coins */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Coins className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-400">{coinsTotal}</h3>
                  <p className="text-gray-300">Total Coins</p>
                </div>
              </div>
            </div>

            {/* Total Gifts */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-400">{gifts.length}</h3>
                  <p className="text-gray-300">Total Gifts</p>
                </div>
              </div>
            </div>

            {/* Claimed Gifts */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-400">{claimedGifts.length}</h3>
                  <p className="text-gray-300">Claimed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-4 hover:from-orange-500/30 hover:to-yellow-500/30 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <Coins className="h-5 w-5 text-orange-400" />
                </div>
                <span className="font-medium">Earn More Coins</span>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/coin-transactions')}
              className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-4 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <span className="font-medium">Coin Transactions</span>
              </div>
            </button>
          </div>

          {/* Gifts Grid */}
          {gifts.length === 0 ? (
            <div className="bg-dark-500 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Gifts Yet</h3>
              <p className="text-gray-400 mb-6">Start earning coins and participating in activities to receive gifts!</p>
              <button className="btn btn-primary">
                <Coins className="h-4 w-4 mr-2" />
                Earn Coins
              </button>
            </div>
          ) : (
            <>
              {/* Unclaimed Gifts */}
              {unclaimedGifts.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Lock className="h-6 w-6 text-orange-400" />
                    Unclaimed Gifts ({unclaimedGifts.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unclaimedGifts.map((gift) => (
                      <ScratchCard
                        key={gift.id}
                        gift={gift}
                        userCoins={coinsTotal}
                        onScratchComplete={handleScratchComplete}
                        isScratching={scratchingGifts.has(gift.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Claimed Gifts */}
              {claimedGifts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    Claimed Gifts ({claimedGifts.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {claimedGifts.map((gift) => (
                      <div
                        key={gift.id}
                        onClick={() => navigate(`/subspace-gifts/${gift.id}`)}
                        className={`bg-gradient-to-br ${getGiftTypeColor(gift.type)} border rounded-xl p-6 opacity-75 hover:opacity-90 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 group`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          {getGiftIcon(gift.type)}
                          <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Claimed
                          </div>
                        </div>
                        
                        {gift.win_image && (
                          <div className="w-16 h-16 mx-auto mb-4 rounded-lg overflow-hidden bg-white/10">
                            <img
                              src={gift.win_image}
                              alt="Gift"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        
                        <div className="text-center">
                          <h3 className="font-bold text-lg mb-2">{gift.win_text}</h3>
                          <div className="text-2xl font-bold text-gray-400 mb-4 flex items-center justify-center gap-2">
                            <img src="/coin.svg" alt="Coin" className="w-6 h-6 opacity-75" />
                            <span>{gift.value}</span>
                          </div>
                          <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                            Click to view details
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SubspaceGiftsPage;