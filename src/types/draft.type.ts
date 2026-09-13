import type { GeminiInteraction } from "./llm.type";
import type { AIChatBoxRef } from "@/components/ai-chat-box";

/**
 * Chat message item representing either user or AI messages in a draft session.
 */
export interface ChatMessageItem {
  id: string;
  role: "user" | "ai";
  content: string;
  date: string;
}



/**
 * Options for client-side draft streaming.
 */
export interface StreamDraftClientOptions {
  prompt: string;
  interactionId?: string;
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
  onGenerated?: (data: GeminiInteraction) => void;
}

/**
 * Return contract for useInteractionChat hook.
 */
export interface UseInteractionChatReturn {
  chatBoxRef: React.RefObject<AIChatBoxRef | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: (text: string) => Promise<void>;
  handleSelectTemplate: (templatePrompt: string) => void;
}
