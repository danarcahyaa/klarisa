import { ASK_CLARIFICATION } from "./ask-clarification";
import { EXTRACT_CONTRACT_CLAUSES } from "./extract-contract-clause";
import { REJECT_OUT_OF_SCOPE } from "./reject-out-of-scope";

import { AGENT_CLARIFICATION } from "./agent-clarification";
import { AGENT_REJECT_OUT_OF_SCOPE } from "./agent-reject-out-of-scope";
import { AGENT_TEXT_OUTPUT } from "./agent-text-output";
import { AGENT_DIFF_REPLACE } from "./agent-diff-replace";
import { AGENT_ANALYZE_REVIEW } from "./agent-analyze-review";

export {
  ASK_CLARIFICATION,
  EXTRACT_CONTRACT_CLAUSES,
  REJECT_OUT_OF_SCOPE,
  AGENT_CLARIFICATION,
  AGENT_REJECT_OUT_OF_SCOPE,
  AGENT_TEXT_OUTPUT,
  AGENT_DIFF_REPLACE,
  AGENT_ANALYZE_REVIEW,
};

/**
 * All legacy contract tools used for Gemini Interactions in initial draft creation.
 */
export const CONTRACT_TOOLS = [
  ASK_CLARIFICATION,
  EXTRACT_CONTRACT_CLAUSES,
  REJECT_OUT_OF_SCOPE,
];

/**
 * Dedicated tools for Agentic Contract Execution:
 * 1. Clarification (with draft context) -> AGENT_CLARIFICATION
 * 2. Out-of-scope Rejection (outside contract context) -> AGENT_REJECT_OUT_OF_SCOPE
 * 3. Contract Text Interaction:
 *    - Diff & Replace -> AGENT_DIFF_REPLACE
 * 4. Contract Analysis & Review -> AGENT_ANALYZE_REVIEW
 */
export const AGENT_CONTRACT_TOOLS = [
  AGENT_CLARIFICATION,
  AGENT_REJECT_OUT_OF_SCOPE,
  AGENT_DIFF_REPLACE,
  AGENT_ANALYZE_REVIEW,
];

