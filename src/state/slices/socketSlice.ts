
import { StateCreator } from "zustand";
import { io } from "socket.io-client";
import { ChatState, ChatMessage, Client, ChatGroup } from "../types/chatTypes";
import { useAuthStore } from "../authStore";
import { getConfig } from "@/config";

export interface SocketSlice {
	socket: null | any;
	isConnected: boolean;
	connect: () => void;
	disconnect: () => void;
}

const getSocketServerUrl = () => {
	const config = getConfig();
	return config.socketServerUrl;
};

export const createSocketSlice: StateCreator<
	ChatState,
	[],
	[],
	SocketSlice
> = (set, get) => ({
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
});
