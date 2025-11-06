import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePrivacySettings } from '../../api/settings';

export const useUpdatePrivacySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      authToken,
      userId,
      hidePhoneNumber,
      hideEmailId,
    }: {
      authToken: string;
      userId: string;
      hidePhoneNumber: boolean;
      hideEmailId: boolean;
    }) => updatePrivacySettings(authToken, userId, hidePhoneNumber, hideEmailId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch privacy settings
      queryClient.invalidateQueries({ queryKey: ['privacySettings', variables.userId] });
    },
  });
};
