
import { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";
import { ChatMessage, ChatState, MessageFetchParams } from "../types/chatTypes";

export interface MessageSlice {
	messages: ChatMessage[];
	recentPrivateMessages: Record<string, ChatMessage>;
	recentMessagesTimestamp: number | null;
	sendMessage: (content: string, to: string, isPrivate: boolean, toId?: string, image?: string) => void;
	editMessage: (messageId: string, newContent: string) => void;
	reactToMessage: (messageId: string, reaction: string) => void;
	clearChatMessages: () => void;
	isLoadingMessages: boolean;
	hasMoreMessages: boolean;
	oldestMessageTimestamp: Record<string, number>;
	setOldestMessageTimestamp: (chatId: string, timestamp: number) => void;
	fetchMessages: (target: string, type: "private" | "group", limit?: number, before?: number) => void;
	fetchRecentMessages: (limit?: number) => void;
}

export const createMessageSlice: StateCreator<
	ChatState,
	[],
	[],
	MessageSlice
> = (set, get) => ({
	messages: [],
	recentPrivateMessages: {},
	recentMessagesTimestamp: null,
	isLoadingMessages: false,
	hasMoreMessages: true,
	oldestMessageTimestamp: {},
	
	sendMessage: (content: string, to: string, isPrivate: boolean, toId?: string, image?: string) => {
		const { socket, clientName, clientId } = get();

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
			reactions: {}, // Initialize with empty reactions object
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
								lastMessageSender: clientName
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
		const { socket, messages, clientName } = get();

		const messageToEdit = messages.find((msg) => msg.id === messageId);

		if (!messageToEdit) {
			console.error("Cannot edit message: Message not found");
			return;
		}

		set((state) => ({
			messages: state.messages.map((message) =>
				message.id === messageId ? { ...message, content: newContent, edited: true, editedBy: clientName } : message
			),
		}));

		if (socket && socket.connected) {
			socket.emit("editMessage", { messageId, newContent });
		}
	},

	reactToMessage: (messageId: string, reaction: string) => {
		const { socket, messages, clientName, clientId } = get();

		const messageToReact = messages.find((msg) => msg.id === messageId);

		if (!messageToReact) {
			console.error("Cannot react to message: Message not found");
			return;
		}

		const userReaction = { id: clientId, name: clientName, timestamp: Date.now() };
        
        // Initialize reactions if undefined
        const messageReactions = messageToReact.reactions || {};
        
        // Find if the user has any existing reaction on this message
        let existingReaction: string | null = null;
        Object.entries(messageReactions).forEach(([emoji, users]) => {
            if (users && users.some(user => user.id === clientId)) {
                existingReaction = emoji;
            }
        });
        
        set((state) => ({
            messages: state.messages.map((message) => {
                if (message.id !== messageId) return message;
                
                // Initialize reactions if undefined
                const reactions = message.reactions || {};
                
                // Create new reactions object
                const newReactions = { ...reactions };
                
                // Remove existing reaction if user had one
                if (existingReaction) {
                    newReactions[existingReaction] = (reactions[existingReaction] || [])
                        .filter(user => user.id !== clientId);
                    
                    // Clean up empty reaction arrays
                    if (newReactions[existingReaction].length === 0) {
                        delete newReactions[existingReaction];
                    }
                }
                
                // Add new reaction if not toggling the same one
                if (existingReaction !== reaction) {
                    newReactions[reaction] = [
                        ...(reactions[reaction] || []), 
                        userReaction
                    ];
                }
                
                return {
                    ...message,
                    reactions: newReactions
                };
            })
        }));

		if (socket && socket.connected) {
			socket.emit("reactToMessage", { 
				messageId, 
				reaction,
				previousReaction: existingReaction 
			});
		}
	},

	clearChatMessages: () => {
		set({ messages: [] });
	},
	
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

	fetchRecentMessages: (limit = 20) => {
		const { socket, recentMessagesTimestamp } = get();

		if (!socket || !socket.connected) {
			console.error("Cannot fetch recent messages: Socket not connected");
			return;
		}

		socket.emit("fetchRecentMessages", {
			timestamp: recentMessagesTimestamp || undefined,
			limit: limit
		});
	}
});
