import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "./authStore";

// Define the message type
export interface ChatMessage {
	id: string;
	from: string;
	content: string;
	timestamp: number;
	isPrivate: boolean;
	to?: string; // For private messages or group name
	image?: string; // Optional image URL
	reactions?: string; // Single emoji reaction 
	edited?: boolean; // Flag to indicate if message has been edited
}

// Define chat group type
export interface ChatGroup {
	name: string;
	members: string[];
	creator?: string;
	lastMessage?: {
		content: string;
		timestamp: number;
	};
}

// Define our state interface
interface ChatState {
	// Client information
	clientName: string;
	setClientName: (name: string) => void;

	// Connected clients
	connectedClients: string[];
	offlineClients: string[];

	// Active chat
	activeChat: string | null;
	activeChatType: 'private' | 'group' | null;
	setActiveChat: (name: string | null, type: 'private' | 'group' | null) => void;
	clearActiveChat: () => void;

	// Chat groups
	availableGroups: ChatGroup[];
	createGroup: (name: string) => void;
	joinGroup: (groupName: string) => void;
	leaveGroup: (groupName: string) => void;
	deleteGroup: (groupName: string) => void;

	// Chat messages
	messages: ChatMessage[];
	sendMessage: (content: string, to: string, image?: string) => void;
	editMessage: (messageId: string, newContent: string) => void;
	reactToMessage: (messageId: string, reaction: string) => void;
	clearChatMessages: () => void;

	// Socket connection
	socket: Socket | null;
	isConnected: boolean;
	connect: () => void;
	disconnect: () => void;
}

// Socket server URL - replace with your actual server URL when deployed
const SOCKET_SERVER_URL = "http://localhost:5000";

export const useChatStore = create<ChatState>((set, get) => ({
  
	// Client name state - add null check for currentUser
	clientName: useAuthStore.getState().currentUser?.username || "Guest",
	setClientName: (name: string) => {
		set({ clientName: name });

		// If we're already connected, update the name on the server
		const { socket } = get();
		if (socket && socket.connected) {
			socket.emit("updateName", name);
		}
	},

	// Connected clients state
	connectedClients: [],
	offlineClients: [],

	// Active chat state
	activeChat: null,
	activeChatType: null,
	setActiveChat: (name, type) => {
		set({ activeChat: name, activeChatType: type });
	},
	clearActiveChat: () => {
		set({ activeChat: null, activeChatType: null });
	},

	// Chat groups state
	availableGroups: [],
	createGroup: (name: string) => {
		const { socket, clientName, availableGroups } = get();

		// Check if group already exists
		if (availableGroups.some((group) => group.name === name)) {
			console.warn(`Group ${name} already exists`);
			return;
		}

		// Create locally first
		set((state) => ({
			availableGroups: [...state.availableGroups, { 
				name, 
				members: [clientName],
				creator: clientName 
			}],
		}));

		// Emit to server if connected
		if (socket && socket.connected) {
			socket.emit("createGroup", { name, creator: clientName });
		}
	},

	joinGroup: (groupName: string) => {
		const { socket, clientName, availableGroups } = get();

		// Update local state
		set((state) => ({
			availableGroups: state.availableGroups.map((group) =>
				group.name === groupName && !group.members.includes(clientName)
					? { ...group, members: [...group.members, clientName] }
					: group
			),
		}));

		// Emit to server
		if (socket && socket.connected) {
			socket.emit("joinGroup", { groupName, client: clientName });
		}
	},

	leaveGroup: (groupName: string) => {
		const { socket, clientName, activeChat, activeChatType } = get();

		// Update local state
		set((state) => ({
			availableGroups: state.availableGroups.map((group) =>
				group.name === groupName ? { ...group, members: group.members.filter((m) => m !== clientName) } : group
			),
		}));

		// If this was the active chat, clear it
		if (activeChat === groupName && activeChatType === 'group') {
			set({ activeChat: null, activeChatType: null });
		}

		// Emit to server
		if (socket && socket.connected) {
			socket.emit("leaveGroup", { groupName, client: clientName });
		}
	},
	
	deleteGroup: (groupName: string) => {
		const { socket, clientName, activeChat, activeChatType } = get();
		
		// Check if the user is the creator before deleting
		const group = get().availableGroups.find(g => g.name === groupName);
		if (!group || group.creator !== clientName) {
			console.warn("You don't have permission to delete this group");
			return;
		}
		
		// Update local state
		set((state) => ({
			availableGroups: state.availableGroups.filter((group) => group.name !== groupName),
		}));
		
		// If this was the active chat, clear it
		if (activeChat === groupName && activeChatType === 'group') {
			set({ activeChat: null, activeChatType: null });
		}
		
		// Emit to server
		if (socket && socket.connected) {
			socket.emit("deleteGroup", { groupName, client: clientName });
		}
	},

	// Messages state
	messages: [],
	clearChatMessages: () => {
		set({ messages: [] });
	},
	
	sendMessage: (content: string, to: string, image?: string) => {
		const { socket, clientName, availableGroups } = get();

		if (!socket || !socket.connected) {
			console.error("Cannot send message: Socket not connected");
			return;
		}

		// Check if sending to a group or private
		const isGroup = availableGroups.some((group) => group.name === to);

		const messageData = {
			id: uuidv4(),
			content,
			from: clientName,
			isPrivate: !isGroup,
			to,
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
				availableGroups: state.availableGroups.map(group => 
					group.name === to 
						? { 
							...group, 
							lastMessage: {
								content: content.length > 30 ? content.substring(0, 30) + '...' : content,
								timestamp: Date.now()
							} 
						} 
						: group
				)
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
		const token = authState.token || '';

		// Create a new socket connection
		const socket = io(SOCKET_SERVER_URL, {
			autoConnect: true,
			reconnection: true,
			auth: {
				token: token,
			},
		});

		// Handle connection
		socket.on("connect", () => {
			console.log("Connected to socket server");
			set({ isConnected: true });

			// Send current name if it exists
			const { clientName } = get();
			if (clientName) {
				socket.emit("updateName", clientName);
			}
		});

		// Handle disconnection
		socket.on("disconnect", () => {
			console.log("Disconnected from socket server");
			set({ isConnected: false });
		});

		// Handle client list updates
		socket.on("clients", (clients: string[]) => {
			set({ connectedClients: clients });
		});
		
		// Handle offline clients
		socket.on("offlineClients", (clients: string[]) => {
			set({ offlineClients: clients });
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
					availableGroups: state.availableGroups.map(group => 
						group.name === message.to 
							? { 
								...group, 
								lastMessage: {
									content: message.content.length > 30 ? message.content.substring(0, 30) + '...' : message.content,
									timestamp: message.timestamp
								} 
							} 
							: group
					)
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
