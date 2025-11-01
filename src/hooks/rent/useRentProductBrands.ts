import {useQuery} from '@tanstack/react-query';
import { fetchRentProductBrands } from '../../api/rent';

export const useRentProductBrands = ({
  authToken,
  userId,
  classId,
  address
}: {
  authToken: string;
  userId: string;
  classId: string;
  address: Record<string, any>
}) => {
  const hasValidAddress = !!address?.latitude && !!address?.longitude;

  return useQuery({
    queryKey: ['rent_product_brands', classId, address?.latitude, address?.longitude],
    queryFn: () =>
      fetchRentProductBrands({
        authToken,
        userId,
        classId,
        address,
      }),
    enabled: !!classId && hasValidAddress,
    staleTime: 5 * 60 * 1000,
  });
};
