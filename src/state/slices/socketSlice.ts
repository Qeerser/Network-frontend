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
	// Use current window origin if socketServerUrl is empty
	const baseUrl = config.socketServerUrl || window.location.origin;
	// Return base URL without path since we specify path separately
	return baseUrl;
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
		console.log("Socket.IO connecting to:", socketServerUrl, "with path: /api/socket.io/");

		// Try connecting with explicit URL + path
		const socket = io(socketServerUrl, {
			autoConnect: true,
			reconnection: true,
			path: "/api/socket.io/",
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
      
      // Request recent messages on connect with optional limit and timestamp
      const { recentMessagesTimestamp } = get();
      socket.emit("fetchRecentMessages", { 
        timestamp: recentMessagesTimestamp || undefined,
        limit: 20 // Default limit
      });
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
			// Ensure the message has a reactions object
			const messageWithReactions = {
				...message,
				reactions: message.reactions || {}
			};
			
			set((state) => ({
				messages: [...state.messages, messageWithReactions],
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
            },
            // Update the most recent message timestamp if newer
            recentMessagesTimestamp: Math.max(
              state.recentMessagesTimestamp || 0,
              message.timestamp
            )
          };
        });
        
        // Refresh the recent chats with timestamp info
        const { recentMessagesTimestamp } = get();
        socket.emit("fetchRecentMessages", { 
          timestamp: recentMessagesTimestamp,
          limit: 20
        });
			}
		});

		socket.on("messageReacted", ({ 
			messageId, 
			reaction, 
			reactedBy,
			previousReaction 
		}: { 
			messageId: string; 
			reaction: string; 
			reactedBy: { 
				id: string; 
				name: string; 
				timestamp: number 
			};
			previousReaction: string | null;
		}) => {
			set((state) => ({
				messages: state.messages.map((message) => {
					if (message.id !== messageId) return message;
					
					// Initialize reactions if undefined
					const reactions = message.reactions || {};
					const newReactions = { ...reactions };
					
					// Remove previous reaction if it existed
					if (previousReaction && reactions[previousReaction]) {
						newReactions[previousReaction] = (reactions[previousReaction] || [])
							.filter(user => user.id !== reactedBy.id);
						
						// Clean up empty reaction arrays
						if (newReactions[previousReaction].length === 0) {
							delete newReactions[previousReaction];
						}
					}
					
					// Add new reaction if not toggling same reaction
					if (previousReaction !== reaction) {
						newReactions[reaction] = [
							...(reactions[reaction] || []),
							{
								...reactedBy,
								timestamp: reactedBy.timestamp || Date.now()
							}
						];
					}
					
					return {
						...message,
						reactions: newReactions
					};
				}),
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

		socket.on("recentMessages", ({ chats, timestamp }: { chats: Record<string, ChatMessage>; timestamp?: number }) => {
			set((state) => {
				// Update recent private chats with latest messages
				console.log("Received recent messages:", chats, "with timestamp:", timestamp);
				if (!chats) {
					console.warn("Received non-object data for recentMessages event:", chats);
					return state;
				}
				return {
					recentPrivateMessages: {
						...state.recentPrivateMessages,
						...chats,
					},
					// Update the most recent message timestamp if provided
					...(timestamp && { recentMessagesTimestamp: timestamp })
				};
			});
		});

		socket.on("messageEdited", ({ messageId, newContent }: { messageId: string; newContent: string }) => {
			console.log("Message edited:", messageId, newContent);
			set((state) => ({
				messages: state.messages.map((message) =>
					message.id === messageId
						? {
								...message,
								content: newContent,
								edited: true,
								editedAt: Date.now(),
						  }
						: message
				),
			}));
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

	socket.on("clientUpdated", (client: Client) => {
		const { recentPrivateMessages } = get();
		const prevMessage = recentPrivateMessages[client.id];
		const isSender = prevMessage.fromId === client.id;
		set({
			recentPrivateMessages: {
				...recentPrivateMessages,
				[client.id]: {
					...prevMessage,
					...(isSender
						? { from: client.name }
						: { to: client.name}
					)
				}
			}
		});
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
