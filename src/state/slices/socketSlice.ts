
import { StateCreator } from "zustand";
import { io, Socket } from "socket.io-client";
import { ChatState, ChatMessage, Client, ChatGroup } from "../types/chatTypes";
import { useAuthStore } from "../authStore";
import { getConfig } from "@/config";

export interface SocketSlice {
	socket: Socket | null;
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
> = (set, get, api) => ({
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
      
      // Request recent messages on connect
      socket.emit("fetchRecentMessages");
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

			// Handle group messages
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
									lastMessageSender: message.from
							  }
							: group
					),
				}));
			} 
			// Handle private messages real-time ordering
			else {
        // For private messages, update the recentPrivateMessages
        set((state) => {
          const chatId = message.fromId === state.clientId ? message.toId! : message.fromId;
          return {
            recentPrivateMessages: {
              ...state.recentPrivateMessages,
              [chatId]: message
            }
          };
        });
        
        // Refresh the recent chats after receiving a private message
        socket.emit("fetchRecentMessages");
			}
		});

		socket.on("messageEdited", ({ messageId, newContent, editedBy }: { messageId: string; newContent: string; editedBy: string }) => {
			set((state) => ({
				messages: state.messages.map((message) =>
					message.id === messageId ? { ...message, content: newContent, edited: true, editedBy } : message
				),
			}));
		});

		socket.on("messageReacted", ({ messageId, reaction, reactedBy }: { messageId: string; reaction: string; reactedBy: { id: string; name: string } }) => {
			set((state) => ({
				messages: state.messages.map((message) =>
					message.id === messageId
						? {
								...message,
								reactions: {
									...message.reactions,
									[reaction]: [...(message.reactions?.[reaction] || []), reactedBy]
								}
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

		socket.on("recentMessages", ({ chats }: { chats: Record<string, ChatMessage> }) => {
			set((state) => {
				// Update recent private chats with latest messages
				return {
					recentPrivateMessages: chats
				};
			});
		});
    
    socket.on("userTyping", ({ userId, chatId, isTyping }: { userId: string; chatId: string; isTyping: boolean }) => {
      // Handle user typing indicator
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'} in chat ${chatId}`);
      // This could update a state to show typing indicators in the UI
    });
    
    socket.on("userPresenceChanged", ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      // Handle user presence changes
      console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
      // This will be handled by the clients/offlineClients updates
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
