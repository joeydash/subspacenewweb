import { useQuery } from '@tanstack/react-query';
import { fetchPrivacySettings, PrivacySettings } from '../../api/settings';

export const usePrivacySettings = (authToken: string | undefined, userId: string | undefined) => {
  return useQuery<PrivacySettings, Error>({
    queryKey: ['privacySettings', userId],
    queryFn: () => fetchPrivacySettings(authToken!, userId!),
    enabled: !!authToken && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
