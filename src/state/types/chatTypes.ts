
import { Socket } from "socket.io-client";

export interface ChatMessage {
	id: string;
	content: string;
	from: string;
	fromId: string;
	to: string;
	toId?: string;
	timestamp: number;
	isPrivate: boolean;
	image?: string;
	reactions?: Record<string, Array<{id: string, name: string}>>;
	edited?: boolean;
	editedBy?: string;
}

export interface ChatGroup {
	id: string;
	name: string;
	creator: string;
	creatorId?: string;
	members: string[];
	memberIds: string[];
	lastMessage?: {
		content: string;
		timestamp: number;
	};
	lastMessageSender?: string;
	joined?: boolean;
}

export interface Client {
	id: string;
	name: string;
}

export interface Chat {
	id: string;
	name: string;
	type: "private" | "group" | null;
	lastMessage?: {
		content: string;
		timestamp: number;
	};
	lastMessageSender?: string;
}

export interface MessageFetchParams {
	target: string;
	type: "private" | "group";
	limit?: number;
	before?: number;
}

export interface ChatState {
	// Client state
	clientName: string;
	clientId: string;
	connectedClients: Client[];
	offlineClients: Client[];
	setClientName: (name: string) => void;
	setClientId: (id: string) => void;

	// Chat state
	activeChat: Chat;
	fetchedChats: Record<string, boolean>;
	setFetchedChats: (chatId: string, fetched: boolean) => void;
	setActiveChat: (chat: Chat) => void;
	clearActiveChat: () => void;

	// Group state
	availableGroups: ChatGroup[];
	createGroup: (name: string) => Chat;
	joinGroup: (group: Chat) => void;
	leaveGroup: (group: Chat) => void;
	deleteGroup: (group: Chat) => void;
	renameGroup: (group: Chat, newName: string) => void;

	// Message state
	messages: ChatMessage[];
	recentPrivateMessages: Record<string, ChatMessage>;
	sendMessage: (content: string, to: string, isPrivate: boolean, toId?: string, image?: string) => void;
	editMessage: (messageId: string, newContent: string) => void;
	reactToMessage: (messageId: string, reaction: string) => void;
	clearChatMessages: () => void;
	isLoadingMessages: boolean;
	hasMoreMessages: boolean;
	oldestMessageTimestamp: Record<string, number>;
	setOldestMessageTimestamp: (chatId: string, timestamp: number) => void;
	fetchMessages: (target: string, type: "private" | "group", limit?: number, before?: number) => void;
	fetchRecentMessages: () => void;

	// Socket state
	socket: Socket | null;
	isConnected: boolean;
	connect: () => void;
	disconnect: () => void;
	
	// For backward compatibility
	connectSocket: () => void;
	disconnectSocket: () => void;
}
