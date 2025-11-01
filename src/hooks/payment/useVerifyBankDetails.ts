import { useMutation } from "@tanstack/react-query";
import { verifyAndSaveBankDetails } from "../../api/payment";
import { BANK_DETAILS_BASE_KEY } from "./useBankDetails";

export const useVerifyBankDetails = () => {
  return useMutation({
    mutationFn: verifyAndSaveBankDetails,
    onSuccess: (_data, variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: [BANK_DETAILS_BASE_KEY, variables.userId] });
    },
  });
};
