
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "./authStore";
import { ChatState } from "./types/chatTypes";
import { createClientSlice } from "./slices/clientSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createGroupSlice } from "./slices/groupSlice";
import { createMessageSlice } from "./slices/messageSlice";
import { createSocketSlice } from "./slices/socketSlice";

export type { ChatMessage, ChatGroup, Client, Chat } from "./types/chatTypes";

export const useChatStore = create<ChatState>((set, get) => ({
	...createClientSlice(set, get),
	...createChatSlice(set, get),
	...createGroupSlice(set, get),
	...createMessageSlice(set, get),
	...createSocketSlice(set, get),
	
	// Initialize with default values
	clientName: useAuthStore.getState().currentUser?.username || "Guest",
	clientId: useAuthStore.getState().currentUser?.id || uuidv4(),
}));
