import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "./authStore";
import { toast } from "@/components/ui/use-toast";
import { getConfig } from "@/config";
import { group } from "console";

// Define the message type
export interface ChatMessage {
	id: string;
	from: string;
	fromId: string; // Added userId for the sender
	content: string;
	timestamp: number;
	isPrivate: boolean;
	to?: string; // For private messages or group name
	toId?: string; // Added userId for the recipient
	image?: string; // Optional image URL
	reactions?: string; // Single emoji reaction
	edited?: boolean; // Flag to indicate if message has been edited
}

// Define chat group type
export interface ChatGroup {
	id?: string; // Optional ID for the group
	name: string;
	members: string[];
	memberIds: string[]; // Added for storing user IDs
	creator?: string;
	creatorId?: string; // Added creator ID
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
	id: string ;
	name: string ;
	type: "private" | "group" | null;
}

// Define our state interface
interface ChatState {
	// Client information
	clientName: string;
	clientId: string;
	setClientName: (name: string) => void;
	setClientId: (id: string) => void;

	// Connected clients
	connectedClients: Client[];
	offlineClients: Client[];

	// Active chat
	activeChat: Chat;
	setActiveChat: (chat: Chat) => void;
	clearActiveChat: () => void;

	// Chat groups
	availableGroups: ChatGroup[];
	createGroup: (name: string) => Chat;
	joinGroup: (targetGroup: Chat) => void;
	leaveGroup: (targetGroup: Chat) => void;
	deleteGroup: (targetGroup: Chat) => void;

	// Chat messages
	messages: ChatMessage[];
	sendMessage: (content: string, to: string, isPrivate: boolean, toId?: string, image?: string) => void;
	editMessage: (messageId: string, newContent: string) => void;
	reactToMessage: (messageId: string, reaction: string) => void;
	clearChatMessages: () => void;

	// Message fetching
	fetchMessages: (target: string, type: "private" | "group", limit?: number, before?: number) => void;
	isLoadingMessages: boolean;
	hasMoreMessages: boolean;
	oldestMessageTimestamp: Record<string, number>;
	setOldestMessageTimestamp: (chatId: string, timestamp: number) => void;

	// Socket connection
	socket: Socket | null;
	isConnected: boolean;
	connect: () => void;
	disconnect: () => void;
}

// Get socket server URL from config
const getSocketServerUrl = () => {
	const config = getConfig();
	return config.socketServerUrl;
};

export const useChatStore = create<ChatState>((set, get) => ({
	// Client name and ID state - add null check for currentUser
	clientName: useAuthStore.getState().currentUser?.username || "Guest",
	clientId: useAuthStore.getState().currentUser?.id || uuidv4(),
	setClientName: (name: string) => {
		set({ clientName: name });

		// If we're already connected, update the name on the server
		const { socket } = get();
		if (socket && socket.connected) {
			socket.emit("updateName", name);
		}
	},
	setClientId: (id: string) => {
		set({ clientId: id });
	},

	// Connected clients state
	connectedClients: [],
	connectedClientIds: [],
	offlineClients: [],
	offlineClientIds: [],

	// Active chat state
	activeChat: { id: "", name: "", type: null },
	activeChatId: null,
	activeChatType: null,
	setActiveChat: (chat: Chat) => {
		set({ activeChat: chat });
	},
	clearActiveChat: () => {
		set({ activeChat: { id: "", name: "", type: null } });
	},

	// Chat groups state
	availableGroups: [],
	createGroup: (name: string): Chat => {
		const { socket, clientName, clientId, availableGroups } = get();
		const groupId = uuidv4();
		// Check if group already exists
		if (availableGroups.some((group) => group.name === name)) {
			console.warn(`Group ${name} already exists`);
			return;
		}
		const newGroup: ChatGroup = {
			id: groupId,
			name,
			members: [clientName],
			memberIds: [clientId],
			creator: clientName,
			creatorId: clientId,
		};

		// Create locally first
		set((state) => ({
			availableGroups: [
				...state.availableGroups,
				{
					id: groupId,
					name,
					members: [clientName],
					memberIds: [clientId],
					creator: clientName,
					creatorId: clientId,
				},
			],
		}));

		// Emit to server if connected
		if (socket && socket.connected) {
			socket.emit("createGroup", { name, groupId, creator: clientName, creatorId: clientId });
		}
		return { id: groupId, name, type: "group" };
	},

	joinGroup: (targetGroup: Chat) => {
		const { socket, clientName, clientId, availableGroups } = get();

		// Update local state
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

		// Emit to server
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
		const { socket, clientName, clientId, activeChat } = get();

		// Update local state
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

		// If this was the active chat, clear it
		if (activeChat.name === targetGroup.name && activeChat.type === "group") {
			set({ activeChat: null });
		}

		// Emit to server
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

		// Check if the user is the creator before deleting
		const group = get().availableGroups.find((g) => g.name === targetGroup.name);
		if (!group || (group.creator !== clientName && group.creatorId !== clientId)) {
			console.warn("You don't have permission to delete this group");
			return;
		}

		// Update local state
		set((state) => ({
			availableGroups: state.availableGroups.filter((group) => group.name !== targetGroup.name),
		}));

		// If this was the active chat, clear it
		if (activeChat.name === targetGroup.name && activeChat.type === "group") {
			set({ activeChat: null });
		}

		// Emit to server
		if (socket && socket.connected) {
			socket.emit("deleteGroup", {
				groupName: targetGroup.name,
				groupId: targetGroup.id,
				client: clientName,
				clientId,
			});
		}
	},

	// Messages state
	messages: [],
	clearChatMessages: () => {
		set({ messages: [] });
	},

	// Message fetching state
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

	fetchMessages: (target: string, type: "private" | "group", limit = 20, before?: number) => {
		const { socket } = get();

		if (!socket || !socket.connected) {
			console.error("Cannot fetch messages: Socket not connected");
			toast({
				title: "Connection Error",
				description: "Cannot fetch messages: Socket not connected",
				variant: "destructive",
			});
			return;
		}

		// Set loading state
		set({ isLoadingMessages: true });

		// Prepare params
		const params = {
			target,
			type,
			limit,
			before,
		};

		// Emit fetch event
		socket.emit("fetchMessages", params);

		// Handle message fetch results
		socket.once("messagesFetched", (response: { messages: ChatMessage[]; hasMore: boolean }) => {
			const { messages: fetchedMessages, hasMore } = response;

			// Find oldest message timestamp
			if (fetchedMessages.length > 0) {
				const timestamps = fetchedMessages.map((m) => m.timestamp);
				const oldestTimestamp = Math.min(...timestamps);

				// Update oldest message timestamp for this chat
				get().setOldestMessageTimestamp(target, oldestTimestamp);
			}

			// Update messages - prepend older messages
			set((state) => ({
				messages: [...fetchedMessages, ...state.messages],
				isLoadingMessages: false,
				hasMoreMessages: hasMore,
			}));
		});

		// Handle fetch errors
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

		// Check if sending to a group or private
		const isGroup = isPrivate === false;

		const messageData = {
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

		// Add message to local state immediately for UI responsiveness
		set((state) => ({
			messages: [...state.messages, messageData],
		}));

		// Update lastMessage in group
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

		// Send to server
		if (isGroup) {
			socket.emit("groupMessage", messageData);
		} else {
			socket.emit("privateMessage", messageData);
		}
	},

	editMessage: (messageId: string, newContent: string) => {
		const { socket, messages } = get();

		// Find the message to edit
		const messageToEdit = messages.find((msg) => msg.id === messageId);

		if (!messageToEdit) {
			console.error("Cannot edit message: Message not found");
			return;
		}

		// Update locally
		set((state) => ({
			messages: state.messages.map((message) =>
				message.id === messageId ? { ...message, content: newContent, edited: true } : message
			),
		}));

		// Send to server if connected
		if (socket && socket.connected) {
			socket.emit("editMessage", { messageId, newContent });
		}
	},

	reactToMessage: (messageId: string, reaction: string) => {
		const { socket, messages } = get();

		// Find the message to react to
		const messageToReact = messages.find((msg) => msg.id === messageId);

		if (!messageToReact) {
			console.error("Cannot react to message: Message not found");
			return;
		}

		// Update locally - Replace existing reaction rather than adding
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

		// Send to server if connected
		if (socket && socket.connected) {
			socket.emit("reactToMessage", { messageId, reaction });
		}
	},

	// Socket state
	socket: null,
	isConnected: false,

	connect: () => {
		// Check if already connected
		if (get().socket?.connected) return;

		// Get token if authenticated
		const authState = useAuthStore.getState();
		const token = authState.token || "";
		const userId = authState.currentUser?.id || "";

		// Get socket server URL from config
		const socketServerUrl = getSocketServerUrl();

		// Create a new socket connection
		const socket = io(socketServerUrl, {
			autoConnect: true,
			reconnection: true,
			auth: {
				token: token,
				userId: userId,
			},
		});

		// Handle connection
		socket.on("connect", () => {
			console.log("Connected to socket server");
			set({ isConnected: true });

			// Send current name and ID if it exists
			const { clientName, clientId } = get();
			if (clientName && clientId) {
				socket.emit("updateClient", { name: clientName, id: clientId });
			}
		});

		// Handle disconnection
		socket.on("disconnect", () => {
			console.log("Disconnected from socket server");
			set({ isConnected: false });
		});

		// Handle client list updates - now with IDs
		socket.on("clients", (clients: { name: string; id: string }[]) => {
			console.log("Connected clients:", clients);
			if (Array.isArray(clients)) {
				set({
					connectedClients: clients,
				});
			} else {
				// Optionally handle non-array case, e.g., clear lists or log error
				console.warn("Received non-array data for offlineClients event:", clients);
				set({ connectedClients: [] });
			}
		});

		// Handle offline clients - now with IDs
		socket.on("offlineClients", (clients: { name: string; id: string }[]) => {
			if (Array.isArray(clients)) {
				set({
					offlineClients: clients,
				});
			} else {
				// Optionally handle non-array case, e.g., clear lists or log error
				console.warn("Received non-array data for offlineClients event:", clients);
				set({ offlineClients: [] });
			}
		});

		// Handle group list updates
		socket.on("groups", (groups: ChatGroup[]) => {
			set({ availableGroups: groups });
		});

		// Handle incoming messages (both private and group)
		socket.on("messageReceived", (message: ChatMessage) => {
			set((state) => ({
				messages: [...state.messages, message],
			}));

			// Update lastMessage in group if it's a group message
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

		// Handle message edits
		socket.on("messageEdited", ({ messageId, newContent }: { messageId: string; newContent: string }) => {
			set((state) => ({
				messages: state.messages.map((message) =>
					message.id === messageId ? { ...message, content: newContent, edited: true } : message
				),
			}));
		});

		// Handle message reactions
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

		// Save socket to state
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
