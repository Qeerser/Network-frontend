
import React, { useState, useEffect, useRef } from "react";
import { Chat, useChatStore } from "@/state/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader, PlusCircle, RefreshCw, UserPlus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

// Import refactored components
import ChatMessage from "./ChatMessage";
import UsersPanel from "./chat/UsersPanel";
import GroupsList from "./chat/GroupsList";
import ChatHeader from "./chat/ChatHeader";
import MessageInput from "./chat/MessageInput";

const ChatInterface: React.FC = () => {
	const {
		clientId,
		clientName,
		connectedClients,
		offlineClients,
		messages,
		sendMessage,
		editMessage,
		reactToMessage,
		joinGroup,
		createGroup,
		leaveGroup,
		deleteGroup,
		renameGroup,
		availableGroups,
		activeChat,
		setActiveChat,
		clearActiveChat,
		clearChatMessages,
		fetchMessages,
		fetchedChats,
		setFetchedChats,
		isLoadingMessages,
		oldestMessageTimestamp,
	} = useChatStore();

	const [chatType, setChatType] = useState<"private" | "group">("group");
	const [newGroupName, setNewGroupName] = useState("");
	const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
	const [showRenameGroupDialog, setShowRenameGroupDialog] = useState(false);
	const [renameGroupText, setRenameGroupText] = useState("");
	
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Handle tab change
	const handleTabChange = (value: string) => {
		console.log("Tab changed to:", value);
		setChatType(value as "private" | "group");
		clearActiveChat(); // Clear active chat when switching tabs
	};

	// Set active chat and fetch messages if not fetched already
	useEffect(() => {
		if (activeChat.id) {
			// Only fetch messages if we haven't already for this chat
			if (!fetchedChats[`${activeChat.type}-${activeChat.id}`]) {
				setFetchedChats(`${activeChat.type}-${activeChat.id}`, true);
				
				console.log(`Fetching messages for ${activeChat.type}:${activeChat.id}`);
				fetchMessages(activeChat.id, activeChat.type, 15);
			}
		}
	}, [activeChat, fetchMessages, fetchedChats, setFetchedChats]);

	// Auto scroll to bottom on new messages or when chat changes
	useEffect(() => {
		if (activeChat.id) {
			setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
			}, 100);
		}
	}, [activeChat.id, messages.length]);

	// Filter messages based on the active chat and chat type
	const filteredMessages = messages.filter((msg) => {
		if (chatType === "private" && activeChat.id) {
			return (
				(msg.fromId === activeChat.id && msg.toId === clientId) ||
				(msg.fromId === clientId && msg.toId === activeChat.id)
			);
		} else if (chatType === "group" && activeChat.id) {
			// Group messages
			return msg.toId === activeChat.id && !msg.isPrivate;
		}
		return false;
	});

	// Sort messages by timestamp
    const sortedMessages = [...filteredMessages].sort((a, b) => a.timestamp - b.timestamp);
	
	// Generate recent private chats based on messages
	const recentPrivateChats = React.useMemo(() => {
		const chatMap = new Map<string, {
			id: string;
			name: string;
			type: "private";
			lastMessage?: {
				content: string;
				timestamp: number;
			};
			lastMessageSender?: string;
		}>();
		
		// Find all private messages
		messages.forEach(msg => {
			if (msg.isPrivate) {
				let chatId;
				let chatName;
				
				// If the message is from the current user to someone else
				if (msg.fromId === clientId) {
					chatId = msg.toId;
					chatName = msg.to;
				}
				// If the message is from someone else to the current user
				else if (msg.toId === clientId) {
					chatId = msg.fromId;
					chatName = msg.from;
				}
				
				if (chatId && chatName) {
					const existingChat = chatMap.get(chatId);
					if (!existingChat || existingChat.lastMessage?.timestamp! < msg.timestamp) {
						chatMap.set(chatId, {
							id: chatId,
							name: chatName,
							type: "private",
							lastMessage: {
								content: msg.content,
								timestamp: msg.timestamp
							},
							lastMessageSender: msg.fromId === clientId ? 'You' : msg.from
						});
					}
				}
			}
		});
		
		// Convert map to array and sort by most recent
		return Array.from(chatMap.values()).sort(
			(a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
		);
	}, [messages, clientId]);

	// Handler for sending messages
	const handleSendMessage = (content: string, image?: string) => {
		if (!activeChat.id) return;

		sendMessage(
			content,
			activeChat.name,
			activeChat.type === "private",
			activeChat.id,
			image
		);

		// Show toast for sent message
		toast({
			title: "Message Sent",
			description: `To: ${activeChat.name}`,
			duration: 2000,
		});
	};

	// Handler for creating groups
	const handleCreateGroup = (e: React.FormEvent) => {
		e.preventDefault();

		if (newGroupName.trim()) {
			const newGroup = createGroup(newGroupName);
			
			setNewGroupName("");
			setShowNewGroupDialog(false);
			setChatType("group");
			setActiveChat(newGroup);

			toast({
				title: "Group Created",
				description: `"${newGroupName}" has been created`,
				variant: "default",
			});
		}
	};
	
	// Handler for rename group
	const handleRenameGroup = (e: React.FormEvent) => {
		e.preventDefault();

		if (!renameGroupText.trim() || !activeChat.id) return;

		renameGroup(activeChat, renameGroupText);
		setRenameGroupText("");
		setShowRenameGroupDialog(false);
	};

	// Handle clear chat
	const handleClearChat = () => {
		clearChatMessages();
		toast({
			title: "Chat Cleared",
			description: "All messages have been cleared",
			variant: "default",
		});
	};

	// Handle scroll to load more messages
	const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
		const target = event.target as HTMLDivElement;
		const scrollContainer = target.querySelector('[data-radix-scroll-area-viewport]');
		
		if (!scrollContainer || isLoadingMessages || !activeChat.id) return;
		
		// Load more messages if scrolled to top (or near)
		if (scrollContainer.scrollTop < 20) {
			console.log("Scrolled to top, loading more messages");
			const beforeTimestamp = oldestMessageTimestamp[activeChat.id];
			
			if (beforeTimestamp) {
				fetchMessages(activeChat.id, activeChat.type, 10, beforeTimestamp);
			} else {
				fetchMessages(activeChat.id, activeChat.type, 10);
			}
		}
	};

	// Check if current user is creator of active group
	const isCreatorOfActiveGroup = activeChat.type === "group" && 
								  availableGroups.some(g => 
									g.id === activeChat.id && 
									(g.creator === clientName || g.creatorId === clientId));

	// Filter out the current user from the connected clients list
	const otherClients = connectedClients.filter((client) => client.name !== clientName && client.id !== clientId);
	
	// Get group members for active chat
	const activeGroupMembers = activeChat.type === "group" 
		? availableGroups.find(g => g.id === activeChat.id)?.members || []
		: [];

	// Sort users alphabetically
	const sortedOtherClients = [...otherClients].sort((a, b) => a.name.localeCompare(b.name));
	const sortedOfflineClients = [...(offlineClients || [])].sort((a, b) => a.name.localeCompare(b.name));

	// Sort groups by last message timestamp if available
	const sortedGroups = [...availableGroups].map(group => {
		// Find the last message for this group
		const groupMessages = messages.filter(msg => msg.toId === group.id && !msg.isPrivate);
		if (groupMessages.length > 0) {
			const lastMsg = groupMessages.sort((a, b) => b.timestamp - a.timestamp)[0];
			return {
				...group,
				lastMessage: {
					content: lastMsg.content.length > 30 ? lastMsg.content.substring(0, 30) + "..." : lastMsg.content,
					timestamp: lastMsg.timestamp
				},
				lastMessageSender: lastMsg.from
			};
		}
		return group;
	}).sort((a, b) => {
		if (a.lastMessage && b.lastMessage) {
			return b.lastMessage.timestamp - a.lastMessage.timestamp;
		}
		if (a.lastMessage) return -1;
		if (b.lastMessage) return 1;
		return a.name.localeCompare(b.name);
	});

	return (
		<div className="flex flex-col h-full border rounded-md overflow-hidden">
			<Tabs defaultValue="group" className="w-full h-full flex flex-col" onValueChange={handleTabChange}>
				<div className="border-b">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="private" className="flex items-center gap-2">
							<UserPlus size={16} /> Private Messages
						</TabsTrigger>
						<TabsTrigger value="group" className="flex items-center gap-2">
							<Users size={16} /> Group Messages
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="flex flex-1 min-h-0">
					{/* Sidebar */}
					<div className="w-1/3 border-r p-4 flex flex-col">
						<div className="flex justify-between items-center mb-3">
							<h3 className="text-sm font-semibold">{chatType === "private" ? "Users" : "Groups"}</h3>

							{chatType === "group" && (
								<Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
									<DialogTrigger asChild>
										<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-lime-600/10 transition-colors">
											<PlusCircle size={16} />
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Create New Group</DialogTitle>
										</DialogHeader>
										<form onSubmit={handleCreateGroup}>
											<Input
												value={newGroupName}
												onChange={(e) => setNewGroupName(e.target.value)}
												placeholder="Group name"
												className="my-4"
											/>
											<DialogFooter>
												<Button type="submit" className="bg-lime-600 hover:bg-lime-700">Create Group</Button>
											</DialogFooter>
										</form>
									</DialogContent>
								</Dialog>
							)}

							{/* Clear chat button */}
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-lime-600/10 transition-colors" onClick={handleClearChat}>
								<RefreshCw size={16} />
							</Button>
						</div>

						{chatType === "private" ? (
							<UsersPanel 
								onlineUsers={sortedOtherClients}
								offlineUsers={sortedOfflineClients}
								activeChat={activeChat}
								recentPrivateChats={recentPrivateChats}
								onUserSelect={(client) => setActiveChat({
									id: client.id,
									name: client.name,
									type: "private"
								})}
								onChatSelect={setActiveChat}
							/>
						) : (
							<ScrollArea className="flex-1">
								<GroupsList 
									groups={sortedGroups}
									activeChat={activeChat}
									clientName={clientName}
									clientId={clientId}
									onGroupSelect={setActiveChat}
									onJoinGroup={joinGroup}
									onLeaveGroup={leaveGroup}
									onDeleteGroup={deleteGroup}
									onRenameGroup={(group) => {
										setRenameGroupText(group.name);
										setActiveChat(group);
										setShowRenameGroupDialog(true);
									}}
								/>
							</ScrollArea>
						)}
					</div>

					{/* Chat Area */}
					<div className="flex-1 flex flex-col">
						<ChatHeader 
							activeChat={activeChat}
							chatType={chatType}
							groupMembers={activeGroupMembers}
							isCreator={isCreatorOfActiveGroup}
							onRenameGroup={() => {
								setRenameGroupText(activeChat.name);
								setShowRenameGroupDialog(true);
							}}
							onDeleteGroup={() => deleteGroup(activeChat)}
							onLeaveGroup={() => leaveGroup(activeChat)}
						/>

						{!activeChat.id && (
							<div className="h-full flex items-center justify-center">
								<p className="text-muted-foreground text-center">
									{chatType === "private"
										? "Select a user to start chatting"
										: "Select a group to join the conversation"}
								</p>
							</div>
						)}

						{activeChat.id && (
							<>
								<div className="flex-1 px-4 overflow-y-auto flex flex-col" onScroll={handleScroll}>
									{isLoadingMessages && (
										<div className="flex justify-center py-3">
											<Loader className="h-5 w-5 animate-spin text-lime-500" />
										</div>
									)}
									
									<div className="mt-auto">
										<div className="flex flex-col space-y-1 pt-4">
											{sortedMessages.length > 0 ? (
												sortedMessages.map((msg) => (
													<ChatMessage
														key={msg.id}
														message={msg}
														isOwnMessage={msg.fromId === clientId}
														isInGroup={activeChat.type === 'group'}
														onEditMessage={msg.fromId === clientId ? editMessage : undefined}
														onReactMessage={reactToMessage}
													/>
												))
											) : (
												<div className="h-full flex items-center justify-center py-10">
													<p className="text-muted-foreground text-center">
														{chatType === "private"
															? `Start a conversation with ${activeChat.name}`
															: `Start chatting in ${activeChat.name}`}
													</p>
												</div>
											)}
											<div ref={messagesEndRef} className="h-4" />
										</div>
									</div>
								</div>
								
								<MessageInput 
									activeChat={activeChat}
									onSendMessage={handleSendMessage}
								/>
							</>
						)}
					</div>
				</div>
			</Tabs>

			{/* Rename Group Dialog */}
			<Dialog open={showRenameGroupDialog} onOpenChange={setShowRenameGroupDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename Group</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleRenameGroup}>
						<Input
							value={renameGroupText}
							onChange={(e) => setRenameGroupText(e.target.value)}
							placeholder="New group name"
							className="my-4"
						/>
						<DialogFooter>
							<Button type="submit" className="bg-lime-600 hover:bg-lime-700">Save</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ChatInterface;
