import { useQuery } from "@tanstack/react-query";
import { fetchCarousels } from "../api/carousels";

export const useCarousels = ({ isAuthenticated, user }) => {
  return useQuery({
    queryKey: ["carousels", { isAuthenticated, userId: user?.id }],
    queryFn: () => fetchCarousels({ isAuthenticated, user }),
    enabled: user != undefined,
    staleTime: 5 * 60 * 1000,
  });
};
