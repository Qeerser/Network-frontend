import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "./authStore";
import { toast } from "@/hooks/use-toast";
import { getConfig } from "@/config";

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

interface MessageFetchParams {
	target: string;
	type: "private" | "group";
	limit: number;
	before?: number;
}

interface ChatState {
	clientName: string;
	clientId: string;
	setClientName: (name: string) => void;
	setClientId: (id: string) => void;

	connectedClients: Client[];
	offlineClients: Client[];

	activeChat: Chat;
	fetchedChats: Record<string, boolean>,
	setFetchedChats : (chatId: string, fetched: boolean) => void;
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

	socket: Socket | null;
	isConnected: boolean;
	connect: () => void;
	disconnect: () => void;
}

const getSocketServerUrl = () => {
	const config = getConfig();
	return config.socketServerUrl;
};

export const useChatStore = create<ChatState>((set, get) => ({
	clientName: useAuthStore.getState().currentUser?.username || "Guest",
	clientId: useAuthStore.getState().currentUser?.id || uuidv4(),
	setClientName: (name: string) => {
		set({ clientName: name });

		const { socket } = get();
		if (socket && socket.connected) {
			socket.emit("updateName", name);
		}
	},
	setClientId: (id: string) => {
		set({ clientId: id });
	},

	connectedClients: [],
	offlineClients: [],

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
	},

	availableGroups: [],
	createGroup: (name: string): Chat => {
		const { socket, clientName, clientId, availableGroups } = get();
		const groupId = uuidv4();
		set({fetchedChats: {...get().fetchedChats, [`group-${groupId}`]: true}});
		if (availableGroups.some((group) => group.name === name)) {
			console.warn(`Group ${name} already exists`);
			return { id: "", name: "", type: null };
		}
		
		const newGroup: ChatGroup = {
			id: groupId,
			name,
			members: [clientName],
			memberIds: [clientId],
			creator: clientName,
			creatorId: clientId,
		};

		set((state) => ({
			availableGroups: [...state.availableGroups, newGroup],
		}));

		if (socket && socket.connected) {
			socket.emit("createGroup", newGroup);
		}
		
		return { id: groupId, name, type: "group" };
	},

	joinGroup: (targetGroup: Chat) => {
		const { socket, clientName, clientId } = get();

		set((state) => ({
			availableGroups: state.availableGroups.map((group) =>
				group.name === targetGroup.name &&
				(!group.members.includes(clientName) || !group.memberIds.includes(clientId))
					? {
							...group,
							members: [...group.members, clientName],
							memberIds: [...(group.memberIds || []), clientId],
					  }
					: group
			),
		}));

		if (socket && socket.connected) {
			socket.emit("joinGroup", {
				groupName: targetGroup.name,
				groupId: targetGroup.id,
				client: clientName,
				clientId,
			});
		}
	},

	leaveGroup: (targetGroup: Chat) => {
		const { socket, clientName, clientId, activeChat, availableGroups } = get();
		
		const group = availableGroups.find(g => g.id === targetGroup.id);
		if (group && (group.creator === clientName || group.creatorId === clientId)) {
			toast({
				title: "Cannot Leave Group",
				description: "As the creator, you can only delete this group.",
				variant: "destructive",
			});
			return;
		}

		set((state) => ({
			availableGroups: state.availableGroups.map((group) =>
				group.name === targetGroup.name
					? {
							...group,
							members: group.members.filter((m) => m !== clientName),
							memberIds: (group.memberIds || []).filter((id) => id !== clientId),
					  }
					: group
			),
		}));

		if (activeChat.name === targetGroup.name && activeChat.type === "group") {
			set({ activeChat: { id: "", name: "", type: null } });
		}

		if (socket && socket.connected) {
			socket.emit("leaveGroup", {
				groupName: targetGroup.name,
				groupId: targetGroup.id,
				client: clientName,
				clientId,
			});
		}
	},

	deleteGroup: (targetGroup: Chat) => {
		const { socket, clientName, clientId, activeChat } = get();

		const group = get().availableGroups.find((g) => g.name === targetGroup.name);
		if (!group || (group.creator !== clientName && group.creatorId !== clientId)) {
			console.warn("You don't have permission to delete this group");
			return;
		}

		set((state) => ({
			availableGroups: state.availableGroups.filter((group) => group.name !== targetGroup.name),
		}));

		if (activeChat.name === targetGroup.name && activeChat.type === "group") {
			set({ activeChat: { id: "", name: "", type: null } });
		}

		if (socket && socket.connected) {
			socket.emit("deleteGroup", {
				groupId: targetGroup.id,
				client: clientId,
			});
		}
	},

	renameGroup: (targetGroup: Chat, newName: string) => {
		const { socket, clientName, clientId } = get();

		const group = get().availableGroups.find((g) => g.id === targetGroup.id);
		if (!group || (group.creator !== clientName && group.creatorId !== clientId)) {
			toast({
				title: "Permission Denied",
				description: "Only the creator can rename this group",
				variant: "destructive",
			});
			return;
		}
		
		set((state) => ({
			availableGroups: state.availableGroups.map((group) =>
				group.id === targetGroup.id
					? {
							...group,
							name: newName,
					  }
					: group
			),
			activeChat: state.activeChat.id === targetGroup.id 
				? { ...state.activeChat, name: newName }
				: state.activeChat
		}));

		if (socket && socket.connected) {
			socket.emit("renameGroup", {
				groupId: targetGroup.id,
				newName,
				clientId,
			});
		}
		
		toast({
			title: "Group Renamed",
			description: `Group renamed to "${newName}"`,
			variant: "default",
		});
	},

	messages: [],
	clearChatMessages: () => {
		set({ messages: [] });
	},

	isLoadingMessages: false,
	hasMoreMessages: true,
	oldestMessageTimestamp: {},

	setOldestMessageTimestamp: (chatId: string, timestamp: number) => {
		set((state) => ({
			oldestMessageTimestamp: {
				...state.oldestMessageTimestamp,
				[chatId]: timestamp,
			},
		}));
	},

	fetchMessages: (target: string, type: "private" | "group", limit = 15, before?: number) => {
		const { socket, oldestMessageTimestamp } = get();

		if (!socket || !socket.connected) {
			console.error("Cannot fetch messages: Socket not connected");
			toast({
				title: "Connection Error",
				description: "Cannot fetch messages: Socket not connected",
				variant: "destructive",
			});
			return;
		}

		set({ isLoadingMessages: true });

		const params: MessageFetchParams = {
			target,
			type,
			limit,
			before: before || oldestMessageTimestamp[target] || Date.now(),
		};

		console.log("Fetching messages with params:", params);

		socket.emit("fetchMessages", params);

		socket.once("messagesFetched", (response: { messages: ChatMessage[]; hasMore: boolean }) => {
			const { messages: fetchedMessages, hasMore } = response;
			console.log("Fetched messages:", fetchedMessages.length);

			if (fetchedMessages.length > 0) {
				const timestamps = fetchedMessages.map((m) => m.timestamp);
				const oldestTimestamp = Math.min(...timestamps);

				get().setOldestMessageTimestamp(target, oldestTimestamp);
			}

			set((state) => {
				const existingIds = new Set(state.messages.map(m => m.id));
				const uniqueNewMessages = fetchedMessages.filter(m => !existingIds.has(m.id));
				
				return {
					messages: [...uniqueNewMessages, ...state.messages],
					isLoadingMessages: false,
					hasMoreMessages: hasMore,
				};
			});
		});

		socket.once("messageFetchError", (error: string) => {
			console.error("Error fetching messages:", error);
			toast({
				title: "Failed to load messages",
				description: error,
				variant: "destructive",
			});
			set({ isLoadingMessages: false });
		});
	},

	sendMessage: (content: string, to: string, isPrivate: boolean, toId?: string, image?: string) => {
		const { socket, clientName, clientId, availableGroups } = get();

		if (!socket || !socket.connected) {
			console.error("Cannot send message: Socket not connected");
			return;
		}

		const isGroup = isPrivate === false;

		const messageData: ChatMessage = {
			id: uuidv4(),
			content,
			from: clientName,
			fromId: clientId,
			isPrivate: !isGroup,
			to,
			toId,
			timestamp: Date.now(),
			image,
		};

		set((state) => ({
			messages: [...state.messages, messageData],
		}));

		if (isGroup) {
			set((state) => ({
				availableGroups: state.availableGroups.map((group) =>
					group.name === to
						? {
								...group,
								lastMessage: {
									content: content.length > 30 ? content.substring(0, 30) + "..." : content,
									timestamp: Date.now(),
								},
						  }
						: group
				),
			}));
		}

		if (isGroup) {
			socket.emit("groupMessage", messageData);
		} else {
			socket.emit("privateMessage", messageData);
		}
	},

	editMessage: (messageId: string, newContent: string) => {
		const { socket, messages } = get();

		const messageToEdit = messages.find((msg) => msg.id === messageId);

		if (!messageToEdit) {
			console.error("Cannot edit message: Message not found");
			return;
		}

		set((state) => ({
			messages: state.messages.map((message) =>
				message.id === messageId ? { ...message, content: newContent, edited: true } : message
			),
		}));

		if (socket && socket.connected) {
			socket.emit("editMessage", { messageId, newContent });
		}
	},

	reactToMessage: (messageId: string, reaction: string) => {
		const { socket, messages } = get();

		const messageToReact = messages.find((msg) => msg.id === messageId);

		if (!messageToReact) {
			console.error("Cannot react to message: Message not found");
			return;
		}

		set((state) => ({
			messages: state.messages.map((message) =>
				message.id === messageId
					? {
							...message,
							reactions: reaction,
					  }
					: message
			),
		}));

		if (socket && socket.connected) {
			socket.emit("reactToMessage", { messageId, reaction });
		}
	},

	socket: null,
	isConnected: false,

	connect: () => {
		if (get().socket?.connected) return;

		const authState = useAuthStore.getState();
		const token = authState.token || "";
		const userId = authState.currentUser?.id || "";

		const socketServerUrl = getSocketServerUrl();

		const socket = io(socketServerUrl, {
			autoConnect: true,
			reconnection: true,
			auth: {
				token: token,
				userId: userId,
			},
		});

		socket.on("connect", () => {
			console.log("Connected to socket server");
			set({ isConnected: true });

			const { clientName, clientId } = get();
			if (clientName && clientId) {
				socket.emit("updateClient", { name: clientName, id: clientId });
			}
		});

		socket.on("disconnect", () => {
			console.log("Disconnected from socket server");
			set({ isConnected: false });
		});

		socket.on("clients", (clients: Client[]) => {
			if (Array.isArray(clients)) {
				set({ connectedClients: clients });
			} else {
				console.warn("Received non-array data for clients event:", clients);
				set({ connectedClients: [] });
			}
		});

		socket.on("offlineClients", (clients: Client[]) => {
			if (Array.isArray(clients)) {
				set({ offlineClients: clients });
			} else {
				console.warn("Received non-array data for offlineClients event:", clients);
				set({ offlineClients: [] });
			}
		});

		socket.on("groups", (groups: ChatGroup[]) => {
			set({ availableGroups: groups });
		});

		socket.on("messageReceived", (message: ChatMessage) => {
			set((state) => ({
				messages: [...state.messages, message],
			}));

			if (!message.isPrivate) {
				set((state) => ({
					availableGroups: state.availableGroups.map((group) =>
						group.name === message.to
							? {
									...group,
									lastMessage: {
										content:
											message.content.length > 30
												? message.content.substring(0, 30) + "..."
												: message.content,
										timestamp: message.timestamp,
									},
							  }
							: group
					),
				}));
			}
		});

		socket.on("messageEdited", ({ messageId, newContent }: { messageId: string; newContent: string }) => {
			set((state) => ({
				messages: state.messages.map((message) =>
					message.id === messageId ? { ...message, content: newContent, edited: true } : message
				),
			}));
		});

		socket.on("messageReacted", ({ messageId, reaction }: { messageId: string; reaction: string }) => {
			set((state) => ({
				messages: state.messages.map((message) =>
					message.id === messageId
						? {
								...message,
								reactions: reaction,
						  }
						: message
				),
			}));
		});

		socket.on("groupRenamed", ({ groupId, newName }: { groupId: string; newName: string }) => {
			set((state) => ({
				availableGroups: state.availableGroups.map((group) =>
					group.id === groupId
						? {
								...group,
								name: newName,
						  }
						: group
				),
				activeChat: state.activeChat.id === groupId 
					? { ...state.activeChat, name: newName }
					: state.activeChat
			}));
		});

		socket.onAny((event, ...args) => {
			console.log(`Received event: ${event}`, args);
		});

		set({ socket });
	},

	disconnect: () => {
		const { socket } = get();
		if (socket) {
			socket.disconnect();
			set({ socket: null, isConnected: false });
		}
	},
}));
