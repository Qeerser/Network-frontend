
import { Socket } from "socket.io-client";

export interface ChatMessage {
	id: string;
	from: string;
	fromId: string;
	content: string;
	timestamp: number;
	isPrivate: boolean;
	to?: string; 
	toId?: string;
	image?: string;
	reactions?: string;
	edited?: boolean;
}

export interface ChatGroup {
	id: string;
	name: string;
	members: string[];
	memberIds: string[];
	creator?: string;
	creatorId?: string;
	lastMessage?: {
		content: string;
		timestamp: number;
	};
}

export interface Client {
	name: string;
	id: string;
}

export interface Chat {
	id: string;
	name: string;
	type: "private" | "group" | null;
}

export interface MessageFetchParams {
	target: string;
	type: "private" | "group";
	limit: number;
	before?: number;
}

export interface ChatState {
	clientName: string;
	clientId: string;
	setClientName: (name: string) => void;
	setClientId: (id: string) => void;

	connectedClients: Client[];
	offlineClients: Client[];

	activeChat: Chat;
	fetchedChats: Record<string, boolean>;
	setFetchedChats: (chatId: string, fetched: boolean) => void;
	setActiveChat: (chat: Chat) => void;
	clearActiveChat: () => void;

	availableGroups: ChatGroup[];
	createGroup: (name: string) => Chat;
	joinGroup: (targetGroup: Chat) => void;
	leaveGroup: (targetGroup: Chat) => void;
	deleteGroup: (targetGroup: Chat) => void;
	renameGroup: (targetGroup: Chat, newName: string) => void;

	messages: ChatMessage[];
	sendMessage: (content: string, to: string, isPrivate: boolean, toId?: string, image?: string) => void;
	editMessage: (messageId: string, newContent: string) => void;
	reactToMessage: (messageId: string, reaction: string) => void;
	clearChatMessages: () => void;

	isLoadingMessages: boolean;
	hasMoreMessages: boolean;
	oldestMessageTimestamp: Record<string, number>;
	setOldestMessageTimestamp: (chatId: string, timestamp: number) => void;
	fetchMessages: (target: string, type: "private" | "group", limit?: number, before?: number) => void;

	socket: Socket | null;
	isConnected: boolean;
	connect: () => void;
	disconnect: () => void;
}
