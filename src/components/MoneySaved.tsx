import React, { useState, useEffect } from 'react';
import { Share2, Users, ShoppingBag, Gift, PiggyBank, TrendingUp, Crown, Award, Star, Coins } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import MoneySavedSkeleton from '../skeletons/MoneySavedSkeleton';

interface UserData {
  dp: string;
  blurhash: string;
  fullname: string;
  whatsub_referral: {
    refer_link: string;
  }[];
}

interface SavingsData {
  buy_debit: number;
  group_join_credit: number;
  group_join_debit: number;
  paid_via_subspace: number;
  savings: number;
}

interface TopSaver {
  savings: number;
  auth_fullname: {
    fullname: string;
    dp: string;
  };
}

interface FriendSaving {
  savings: number;
  auth_fullname: {
    fullname: string;
    dp: string;
  };
}

const MoneySaved: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [savingsData, setSavingsData] = useState<SavingsData | null>(null);
  const [friends, setFriends] = useState<FriendSaving[]>([]);
  const [topSavers, setTopSavers] = useState<TopSaver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('userData ', userData);

  useEffect(() => {
    if (user?.id && user?.auth_token) {
      fetchAllSavingsData();
    }
  }, [user?.id, user?.auth_token]);

  const fetchAllSavingsData = async () => {
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
          query savings($user_id: uuid!) {
            __typename
          
            auth(where: { id: { _eq: $user_id } }) {
              __typename
              dp
              blurhash
              fullname
              whatsub_referral {
                __typename
                refer_link
              }
            }
          
            savings: whatsub_savings_total(where: { user_id: { _eq: $user_id } }) {
              __typename
              buy_debit
              group_join_credit
              group_join_debit
              paid_via_subspace
              savings
            }
          
            whatsub_savings_total(order_by: { savings: desc_nulls_last }, limit: 5) {
              __typename
              savings
              auth_fullname {
                __typename
                fullname
                dp
              }
            }
          
            w_getFriendsSavings(request: { user_id: $user_id }) {
              __typename
              savings
              auth_fullname
            }
          }
          `,
          variables: {
            user_id: user.id
          }
        })
      });

      const data = await response.json();
      console.log('money saved ', data);
      
      if (data.errors) {
        setError('Failed to fetch savings data');
        
        return;
      }
      
      // Set user data
      if (data.data?.auth?.[0]) {
        setUserData(data.data.auth[0]);
      }
      
      // Set savings data
      if (data.data?.savings?.[0]) {
        setSavingsData(data.data.savings[0]);
      }
      
      // Set top savers
      if (data.data?.whatsub_savings_total) {
        setTopSavers(data.data.whatsub_savings_total);
      }
      
      // Set friends savings
      if (data.data?.w_getFriendsSavings) {
        setFriends(data.data.w_getFriendsSavings);
      }
    } catch (error) {
      console.error('Error fetching savings data:', error);
      setError('Failed to fetch savings data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const totalSaved = (savingsData?.savings || 0) / 100;
    const referLink = userData?.whatsub_referral?.refer_link;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Subspace Savings',
          text: `I've saved ₹${(totalSaved / 100).toLocaleString()} using Subspace! Join me and start saving on your subscriptions.`,
          url: referLink
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareUrl = referLink || window.location.href;
      const text = `I've saved ₹${(totalSaved / 100).toLocaleString()} using Subspace! Join me and start saving on your subscriptions. ${shareUrl}`;
      navigator.clipboard.writeText(text);
      // You could show a toast notification here
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-3 w-3 text-white" />;
      case 2:
        return <Award className="h-3 w-3 text-white" />;
      case 3:
        return <Award className="h-3 w-3 text-white" />;
      default:
        return <Star className="h-2 w-2 text-white" />;
    }
  };

  const formatAmount = (amount: number) => {
    const rupees = amount / 100;
    if (rupees >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(1)}Cr`;
    } else if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)}L`;
    } else if (rupees >= 1000) {
      return `₹${(rupees / 1000).toFixed(1)}K`;
    }
    return `₹${rupees}`;
  };

  if (isLoading) {
    return <MoneySavedSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const totalSaved = savingsData?.savings || 0;

  return (
    <div className="space-y-8">
      {/* Header with Total Savings */}
      <div className="relative bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 rounded-2xl p-8 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-4 left-8 w-4 h-4 bg-yellow-400 rounded-full opacity-60"></div>
          <div className="absolute top-12 right-12 w-3 h-3 bg-green-400 rounded-full opacity-50"></div>
          <div className="absolute bottom-8 left-16 w-2 h-2 bg-pink-400 rounded-full opacity-70"></div>
          <div className="absolute top-20 left-1/3 w-6 h-6 bg-orange-400 rounded-full opacity-40"></div>
          <div className="absolute bottom-16 right-8 w-5 h-5 bg-blue-400 rounded-full opacity-50"></div>
          <div className="absolute top-8 right-1/4 w-3 h-3 bg-purple-400 rounded-full opacity-60"></div>
          <div className="absolute bottom-4 left-1/2 w-4 h-4 bg-red-400 rounded-full opacity-45"></div>
          
          {/* Geometric shapes */}
          <div className="absolute top-6 right-20 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-cyan-400 opacity-50"></div>
          <div className="absolute bottom-12 left-8 w-0 h-0 border-l-3 border-r-3 border-b-5 border-l-transparent border-r-transparent border-b-yellow-400 opacity-60"></div>
          <div className="absolute top-16 left-1/2 w-4 h-1 bg-green-400 rounded-full opacity-50"></div>
          <div className="absolute bottom-20 right-1/3 w-6 h-1 bg-pink-400 rounded-full opacity-40"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">You Saved</h2>
          <div className="text-5xl font-bold text-[#2CFF05] mb-4">
            ₹{(totalSaved / 100).toLocaleString()}
          </div>
          <p className="text-indigo-200">Total savings through Subspace</p>
        </div>
      </div>

      {/* Savings Categories */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex space-x-4 px-1">
            <div className="bg-dark-400 rounded-xl p-6 text-center flex-none w-48">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-bold text-md mb-1">Sharing Savings</h3>
              <div className="text-green-400 text-sm mb-1">Saved</div>
              <div className="text-[#2CFF05] font-bold">₹{((savingsData?.group_join_debit || 0) / 100).toLocaleString()}</div>
            </div>

            <div className="bg-dark-400 rounded-xl p-6 text-center flex-none w-48">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="font-bold text-md mb-1">Sharing Earnings</h3>
              <div className="text-green-400 text-sm mb-1">Saved</div>
              <div className="text-[#2CFF05] font-bold">₹{((savingsData?.group_join_credit || 0) / 100).toLocaleString()}</div>
            </div>

            <div className="bg-dark-400 rounded-xl p-6 text-center flex-none w-48">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="font-bold text-md mb-1">Purchase Savings</h3>
              <div className="text-green-400 text-sm mb-1">Saved</div>
              <div className="text-[#2CFF05] font-bold">₹{((savingsData?.buy_debit || 0) / 100).toLocaleString()}</div>
            </div>

            <div className="bg-dark-400 rounded-xl p-6 text-center flex-none w-48">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="font-bold text-md mb-1">Paid via Subspace</h3>
              <div className="text-green-400 text-sm mb-1">Saved</div>
              <div className="text-[#2CFF05] font-bold">₹{((savingsData?.paid_via_subspace || 0) / 100).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Friends Section */}
      <div className="bg-dark-400 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-300 mb-6">Your Friends</h3>
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No friends data available</p>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex space-x-4 px-1">
                {friends.map((friend, index) => (
                  <div key={index} className="flex-none w-32 text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5 mx-auto mb-3">
                      <div className="w-full h-full rounded-full overflow-hidden bg-dark-600">
                        {friend.auth_fullname.dp ? (
                          <img
                            src={friend.auth_fullname.dp}
                            alt={friend.auth_fullname.fullname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">
                              {friend.auth_fullname.fullname.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-white text-sm mb-1 truncate w-full" title={friend.auth_fullname.fullname}>
                      {friend.auth_fullname.fullname}
                    </h4>
                    <div className="text-green-400 text-sm">Saved</div>
                    <div className="text-[#2CFF05] font-bold">₹{(friend.savings / 100).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Savers Section */}
      <div className="bg-dark-400 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-300 mb-6">Top Savers</h3>
        {topSavers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No top savers data available</p>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex space-x-4 px-1">
                {topSavers.map((saver, index) => (
                  <div key={index} className="flex-none w-32 text-center">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5 mx-auto">
                        <div className="w-full h-full rounded-full overflow-hidden bg-dark-600">
                          {saver.auth_fullname.dp ? (
                            <img
                              src={saver.auth_fullname.dp}
                              alt={saver.auth_fullname.fullname}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white text-lg font-bold">
                                {saver.auth_fullname.fullname.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Rank Badge */}
                      <div className="absolute -top-1 -right-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          index === 0 
                            ? 'bg-yellow-500' 
                            : index === 1 
                            ? 'bg-gray-400' 
                            : index === 2 
                            ? 'bg-orange-500' 
                            : 'bg-indigo-500'
                        }`}>
                          {getRankIcon(index + 1)}
                        </div>
                      </div>
                    </div>
                    <div className="h-16 flex flex-col justify-between">
                      <h4 className="font-bold text-white text-sm mb-1 truncate w-full" title={saver.auth_fullname.fullname}>
                        {saver.auth_fullname.fullname}
                      </h4>
                      <div className="text-green-400 text-sm">Saved</div>
                    <div className="text-[#2CFF05] font-bold text-sm">
                        {formatAmount(saver.savings)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
      >
        <Share2 className="h-5 w-5" />
        Share
      </button>
    </div>
  );
};

export default MoneySaved;