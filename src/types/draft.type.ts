import type { GeminiInteraction } from "./llm.type";
import type { AIChatBoxRef } from "@/components/ai-chat-box";

/**
 * Individual status step entry displayed during multi-phase AI operations.
 */
export interface ChatStatusStep {
  text: string;
  isShimmer?: boolean;
}

/**
 * Chat message item representing either user or AI messages in a draft session.
 */
export interface ChatMessageItem {
  id: string;
  role: "user" | "ai";
  content: string;
  date: string;
  isShimmer?: boolean;
  statusSteps?: ChatStatusStep[];
  metadata?: Record<string, unknown> | null;
}

/**
 * Options for upserting an AI chat message item.
 */
export interface UpsertAiChatMessageOptions {
  date?: string;
  isShimmer?: boolean;
  statusSteps?: ChatStatusStep[];
  metadata?: Record<string, unknown> | null;
}

/**
 * Status payload passed during contract clause extraction and regulation matching.
 */
export interface ClauseMatchingStatus {
  message: string;
  isShimmer: boolean;
  statusSteps?: ChatStatusStep[];
}

/**
 * Result structure returned after extracting clauses and matching legal regulations.
 */
export interface MatchRegulationsResult {
  contractType: string;
  matchedArticles: Array<{
    name?: string | null;
    article_number?: string | null;
    content?: string | null;
  }>;
  statusSteps: ChatStatusStep[];
}



/**
 * Options for client-side draft streaming.
 */
export interface StreamDraftClientOptions {
  prompt: string;
  interactionId?: string;
  signal?: AbortSignal;
  onChunk?: (textDelta: string, fullText: string) => void;
  onInteractionId?: (interactionId: string) => void;
}

/**
 * Parameters for useInitialChat hook to initialize a new thread.
 */
export interface UseInitialChatOptions {
  prompt: string;
  setPrompt: (prompt: string) => void;
  messages: ChatMessageItem[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>;
  chatId: string | null;
  setChatId: (id: string | null) => void;
  firstChatTitle: string | null;
  setFirstChatTitle: (title: string | null) => void;
  interactionId: string | null;
  setInteractionId: (id: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingAiId: (id: string | null) => void;
  onGenerated?: (data: GeminiInteraction) => void;
}

/**
 * Return contract for useInitialChat hook.
 */
export interface UseInitialChatReturn {
  handleInitialChat: (text?: string) => Promise<void>;
  handleStop: () => void;
}

/**
 * Parameters for useActionChat hook for managing chat lifecycle and CRUD operations.
 */
export interface UseActionChatOptions {
  initialChatId?: string | null;
  setPrompt: (prompt: string) => void;
  messages: ChatMessageItem[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>;
  chatId: string | null;
  setChatId: (id: string | null) => void;
  setFirstChatTitle: (title: string | null) => void;
  setInteractionId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingAiId: (id: string | null) => void;
}

/**
 * Return contract for useActionChat hook.
 */
export interface UseActionChatReturn {
  isLoadingChat: boolean;
  hasMoreConversations: boolean;
  isLoadingMoreConversations: boolean;
  handleLoadChatDetail: (targetChatId?: string) => Promise<boolean>;
  handleLoadMoreConversations: () => Promise<boolean>;
  handleRenameChat: (chatId: string, newTitle: string) => Promise<boolean>;
  handleDeleteChat: (chatId: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Parameters for useInteractionChat hook for ongoing interactions and auto-scroll.
 */
export interface UseInteractionChatOptions {
  prompt: string;
  setPrompt: (prompt: string) => void;
  messages: ChatMessageItem[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>;
  chatId: string | null;
  setChatId: (id: string | null) => void;
  firstChatTitle: string | null;
  setFirstChatTitle: (title: string | null) => void;
  interactionId: string | null;
  setInteractionId: (id: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  streamingAiId: string | null;
  setStreamingAiId: (id: string | null) => void;
  handleInitialChat: (text?: string) => Promise<void>;
  handleStopInitialChat?: () => void;
  onGenerated?: (data: GeminiInteraction) => void;
}

/**
 * Return contract for useInteractionChat hook.
 */
export interface UseInteractionChatReturn {
  chatBoxRef: React.RefObject<AIChatBoxRef | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: (text: string) => Promise<void>;
  handleStop: () => void;
  handleSelectTemplate: (templatePrompt: string) => void;
}
