
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

export const useChatStore = create<ChatState>()((set, get, api) => ({
	// Include all slices to implement the full ChatState interface
	...createClientSlice(set, get, api),
	...createChatSlice(set, get, api),
	...createGroupSlice(set, get, api),
	...createMessageSlice(set, get, api),
	...createSocketSlice(set, get, api),
	
	// Initialize with default values
	clientName: useAuthStore.getState().currentUser?.username || "Guest",
	clientId: useAuthStore.getState().currentUser?.id || uuidv4(),
}));
