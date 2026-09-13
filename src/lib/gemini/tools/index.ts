import { ASK_CLARIFICATION } from "./ask-clarification";
import { EXTRACT_CONTRACT_CLAUSE } from "./extract-contract-clause";
import { REJECT_OUT_OF_SCOPE } from "./reject-out-of-scope";

export { ASK_CLARIFICATION, EXTRACT_CONTRACT_CLAUSE, REJECT_OUT_OF_SCOPE };

/**
 * All contract tools used for Gemini Interactions in draft creation.
 */
export const CONTRACT_TOOLS = [
  ASK_CLARIFICATION,
  EXTRACT_CONTRACT_CLAUSE,
  REJECT_OUT_OF_SCOPE,
];
