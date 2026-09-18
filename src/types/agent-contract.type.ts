import type React from "react";
import type { GeminiInteraction, GeminiInteractionToolCall } from "@/types/llm.type";
import type { ChatMessageItem } from "@/types/draft.type";

/**
 * Action type for modifying contract draft content or clause text.
 */
export type ContractDiffAction = "replace" | "insert" | "delete";

/**
 * Insertion position for 'insert' action.
 */
export type ContractInsertPosition = "before" | "after";

/**
 * Individual clause or text change proposal within a contract draft.
 */
export interface AgentDiffChangeItem {
  /** Target clause or section name (e.g., 'Pasal 3', 'Ketentuan Pembayaran', or 'Teks Terpilih'). */
  target: string;
  /** Action type: replace existing text, insert new text, or delete text. */
  action: ContractDiffAction;
  /** Position to insert new text relative to anchor/original text (required if action='insert'). */
  insert_position?: ContractInsertPosition | null;
  /** Exact snippet from the current draft content targeted for replacement, deletion, or anchor. */
  original_text: string;
  /** Proposed new or revised text/HTML to be inserted or used as replacement. */
  replacement_text?: string;
  /** Highlight mark ID (e.g., 'hl-123') if change originated from user text selection. */
  target_id?: string | null;
  /** Rationale or legal explanation behind the proposed change. */
  explanation: string;
}

/**
 * Arguments payload for the `agent_diff_replace` tool.
 */
export interface AgentDiffReplaceArgs {
  /** High-level summary of the proposed changes to the contract draft. */
  summary: string;
  /** Detailed list of clause or text changes. */
  changes: AgentDiffChangeItem[];
}

/**
 * Arguments payload for the `agent_text_output` tool (Conversational & Informational Output).
 */
export interface AgentTextOutputArgs {
  /** Brief summary or headline of the response. */
  summary: string;
  /** Comprehensive analysis, explanation, greeting, or answers formatted in markdown. */
  content: string;
  /** Optional list of contract clauses referenced in this response (empty for general chats/greetings). */
  referenced_clauses?: string[];
}

/**
 * Arguments payload for the `agent_clarification` tool.
 */
export interface AgentClarificationArgs {
  /** Friendly and polite clarifying question presented to the user. */
  question: string;
  /** Relevant clause or draft context requiring clarification. */
  draft_context?: string;
  /** Suggested quick-reply options to assist the user in answering. */
  suggested_options?: string[];
}

/**
 * Arguments payload for the `agent_reject_out_of_scope` tool.
 */
export interface AgentRejectOutOfScopeArgs {
  /** Polite Indonesian rejection message explaining the contract draft scope. */
  reason: string;
}

/**
 * Union of all structured tool call payloads produced by the contract agent.
 */
export type AgentToolCallPayload =
  | { name: "agent_diff_replace"; args: AgentDiffReplaceArgs }
  | { name: "agent_text_output"; args: AgentTextOutputArgs }
  | { name: "agent_clarification"; args: AgentClarificationArgs }
  | { name: "agent_reject_out_of_scope"; args: AgentRejectOutOfScopeArgs };

/**
 * Request payload sent to the draft agent streaming endpoint.
 */
export interface AgentStreamRequest {
  /** User instruction or question. */
  prompt: string;
  /** Snippet of text selected by user on the editor canvas (if any). */
  selectedText?: string | null;
  /** ID of the highlight mark corresponding to the active selection (if any). */
  highlightId?: string | null;
  /** Multi-turn Gemini interaction ID to maintain conversation state. */
  interactionId?: string | null;
}

/**
 * Message object stored in the Agent Panel state, adhering to standard ChatMessageItem.
 */
export type AgentChatMessage = ChatMessageItem;

/**
 * Options for client-side streaming of draft agent SSE interactions.
 */
export interface StreamDraftAgentOptions {
  /** User prompt or instruction. */
  prompt: string;
  /** Active selected text snippet from editor (if any). */
  selectedText?: string | null;
  /** Unique highlight mark ID associated with the active selection. */
  highlightId?: string | null;
  /** Previous interaction ID for multi-turn conversational context. */
  interactionId?: string | null;
  /** Abort signal to cancel streaming midway. */
  signal?: AbortSignal;
  /** Callback triggered on every streaming text delta. */
  onChunk?: (delta: string, accumulated: string) => void;
  /** Callback triggered when a structured tool call is yielded by Gemini. */
  onToolCall?: (toolCall: GeminiInteractionToolCall) => void;
  /** Callback triggered when a new interaction ID is generated. */
  onInteractionId?: (interactionId: string) => void;
}

export interface UseDraftEditorAgentOptions {
  /** Text selection passed from editor tooltip for question context */
  selectedText?: string | null;
  /** Unique ID of the highlight mark corresponding to the active selection */
  highlightId?: string | null;
  /** Optional initial chat ID to continue an existing session */
  initialChatId?: string | null;
}

/**
 * Return state and handlers for `useDraftEditorAgent` hook:
 * Focused purely on send/stop chat, message list state, and agent panel status indicators.
 */
export interface UseDraftEditorAgentReturn {
  messages: AgentChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isSending: boolean;
  isLoadingChat: boolean;
  streamingAiId: string | null;
  chatId: string | null;
  chatTitle: string;
  setChatTitle: (title: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleStop: () => void;
  handleSend: (promptText?: string) => Promise<void>;
  handleNewChat: () => void;
  handleSelectChat?: (chatId: string) => Promise<void>;
}

/**
 * Options passed to `useChatResponse` hook.
 */
export interface UseChatResponseOptions {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>;
  /** Optional initial chat thread ID */
  initialChatId?: string | null;
}

/**
 * Parameters to execute an AI streaming response.
 */
export interface StreamChatResponseParams {
  prompt: string;
  selectedText?: string | null;
  highlightId?: string | null;
  title?: string | null;
}

/**
 * Return state and handlers for `useChatResponse` hook:
 * Handles receiving AI streaming deltas, tool responses, stop triggers, and message list updates.
 */
export interface UseChatResponseReturn {
  isSending: boolean;
  streamingAiId: string | null;
  interactionId: string | null;
  chatId: string | null;
  setChatId: (id: string | null) => void;
  handleStop: () => void;
  streamResponse: (params: StreamChatResponseParams) => Promise<void>;
}

// Backward compatibility aliases
export type ContractDiffItem = AgentDiffChangeItem;
export type ContractDiffReplaceArgs = AgentDiffReplaceArgs;
export type ContractTextOutputArgs = AgentTextOutputArgs;
export type AskClarificationArgs = AgentClarificationArgs;
export type RejectOutOfScopeArgs = AgentRejectOutOfScopeArgs;
