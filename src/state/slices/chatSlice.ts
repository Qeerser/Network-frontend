
import { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";
import { Chat, ChatState, ChatGroup } from "../types/chatTypes";

export interface ChatSlice {
	activeChat: Chat;
	fetchedChats: Record<string, boolean>;
	setFetchedChats: (chatId: string, fetched: boolean) => void;
	setActiveChat: (chat: Chat) => void;
	clearActiveChat: () => void;
}

export const createChatSlice: StateCreator<
	ChatState,
	[],
	[],
	ChatSlice
> = (set) => ({
	activeChat: { id: "", name: "", type: null },
	fetchedChats: {},
	
	setFetchedChats: (chatId: string, fetched: boolean) => {
		set((state) => ({
			fetchedChats: {
				...state.fetchedChats,
				[chatId]: fetched,
			},
		}));
	},
	
	setActiveChat: (chat: Chat) => {
		set({ activeChat: chat });
	},
	
	clearActiveChat: () => {
		set({ activeChat: { id: "", name: "", type: null } });
	}
});
