import React, { useState, useEffect, useRef } from "react";
import { Chat, Client, useChatStore } from "@/state/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader, PlusCircle, RefreshCw, UserPlus, Users, Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

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
		fetchRecentMessages,
		fetchedChats,
		setFetchedChats,
		isLoadingMessages,
		hasMoreMessages,
		oldestMessageTimestamp,
		recentPrivateMessages,
	} = useChatStore();

	const [chatType, setChatType] = useState<"private" | "group">("private");
	const [newGroupName, setNewGroupName] = useState("");
	const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
	const [showRenameGroupDialog, setShowRenameGroupDialog] = useState(false);
	const [renameGroupText, setRenameGroupText] = useState("");
	
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		fetchRecentMessages();
	}, []);

	const handleTabChange = (value: string) => {
		console.log("Tab changed to:", value);
		setChatType(value as "private" | "group");
		clearActiveChat();
	};

	useEffect(() => {
		if (activeChat.id) {
			if (!fetchedChats[`${activeChat.type}-${activeChat.id}`]) {
				setFetchedChats(`${activeChat.type}-${activeChat.id}`, true);
				
				console.log(`Fetching messages for ${activeChat.type}:${activeChat.id}`);
				fetchMessages(activeChat.id, activeChat.type, 15);
			}
		}
	}, [activeChat, fetchMessages, fetchedChats, setFetchedChats]);

	useEffect(() => {
		if (activeChat.id) {
			setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
			}, 100);
		}
	}, [activeChat.id, messages.length]);

	const filteredMessages = messages.filter((msg) => {
		if (chatType === "private" && activeChat.id) {
			return (
				(msg.fromId === activeChat.id && msg.toId === clientId) ||
				(msg.fromId === clientId && msg.toId === activeChat.id)
			);
		} else if (chatType === "group" && activeChat.id) {
			return msg.toId === activeChat.id && !msg.isPrivate;
		}
		return false;
	});

	const sortedMessages = [...filteredMessages].sort((a, b) => a.timestamp - b.timestamp);

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
		
		Object.values(recentPrivateMessages).forEach(msg => {
			if (msg.isPrivate) {
				let chatId;
				let chatName;
				
				if (msg.fromId === clientId) {
					chatId = msg.toId;
					chatName = msg.to;
				} else if (msg.toId === clientId) {
					chatId = msg.fromId;
					chatName = msg.from;
				}
				
				if (chatId && chatName) {
					const existingChat = chatMap.get(chatId);
					if (!existingChat || (existingChat.lastMessage?.timestamp ?? -Infinity) < msg.timestamp) {
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
		
		return Array.from(chatMap.values()).sort(
			(a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
		);
	}, [recentPrivateMessages, clientId]);

	const handleSendMessage = (content: string, image?: string) => {
		if (!activeChat.id) return;

		sendMessage(
			content,
			activeChat.name,
			activeChat.type === "private",
			activeChat.id,
			image
		);

		toast({
			title: "Message Sent",
			description: `To: ${activeChat.name}`,
			duration: 2000,
		});
	};

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

	const handleRenameGroup = (e: React.FormEvent) => {
		e.preventDefault();

		if (!renameGroupText.trim() || !activeChat.id) return;

		renameGroup(activeChat, renameGroupText);
		setRenameGroupText("");
		setShowRenameGroupDialog(false);
	};

	const handleClearChat = () => {
		clearChatMessages();
		toast({
			title: "Chat Cleared",
			description: "All messages have been cleared",
			variant: "default",
		});
	};

	const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
		const target = event.target as HTMLDivElement;
		const scrollContainer = target.querySelector('[data-radix-scroll-area-viewport]');
		
		if (!scrollContainer || isLoadingMessages || !activeChat.id) return;
		
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

	const isCreatorOfActiveGroup = activeChat.type === "group" && 
								  availableGroups.some(g => 
									g.id === activeChat.id && 
									(g.creator === clientName || g.creatorId === clientId));

	const handleGroupMemberClick = (member: Client) => {
		setChatType("private");
		
		const existingChat = recentPrivateChats.find(chat => chat.id === member.id);
		
		if (existingChat) {
			setActiveChat(existingChat);
		} else {
			setActiveChat({
				id: member.id,
				name: member.name,
				type: "private"
			});
		}
	};
	
	const handleDeleteGroup = (group: Chat) => {
		deleteGroup(group);
		if (activeChat.id === group.id && activeChat.type === "group") {
			clearActiveChat();
		}
		toast({
			title: "Group deleted",
			description: `"${group.name}" has been deleted`,
			variant: "default",
		});
	};

	const activeGroupMembers = activeChat.type === "group" 
		? availableGroups.find(g => g.id === activeChat.id)?.members || []
		: [];

	const activeGroupMemberObjects = activeChat.type === "group"
		? [...connectedClients, ...offlineClients].filter(client => 
				availableGroups.find(g => g.id === activeChat.id)?.memberIds?.includes(client.id) ||
				availableGroups.find(g => g.id === activeChat.id)?.members?.includes(client.name)
			)
		: [];

	const sortedconnectedClients = [...connectedClients].sort((a, b) => a.name.localeCompare(b.name));
	const sortedOfflineClients = [...(offlineClients || [])].sort((a, b) => a.name.localeCompare(b.name));

	const joinedGroups = availableGroups.filter(group => 
		group.memberIds?.includes(clientId) || group.members?.includes(clientName)
	);
	
	const availableUnjoinedGroups = availableGroups.filter(group => 
		!group.memberIds?.includes(clientId) && !group.members?.includes(clientName)
	);

	const sortedJoinedGroups = [...joinedGroups].sort((a, b) => {
		if (a.lastMessage && b.lastMessage) {
			return b.lastMessage.timestamp - a.lastMessage.timestamp;
		}
		if (a.lastMessage) return -1;
		if (b.lastMessage) return 1;
		return a.name.localeCompare(b.name);
	});

	const sortedAvailableGroups = [...availableUnjoinedGroups].sort((a, b) => 
		a.name.localeCompare(b.name)
	);

	return (
		<div className="flex flex-col h-full border rounded-md overflow-hidden">
			<Tabs value={chatType} defaultValue="private" className="w-full h-full flex flex-col" onValueChange={handleTabChange}>
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

							<Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-lime-600/10 transition-colors" onClick={handleClearChat}>
								<RefreshCw size={16} />
							</Button>
						</div>

						{chatType === "private" ? (
							<UsersPanel 
								onlineUsers={sortedconnectedClients}
								offlineUsers={sortedOfflineClients}
								activeChat={activeChat}
								recentPrivateChats={recentPrivateChats}
								onUserSelect={(client) => setActiveChat({
									id: client.id,
									name: client.name,
									type: "private"
								})}
								onChatSelect={setActiveChat}
								currentUserId={clientId}
							/>
						) : (
							<ScrollArea className="flex-1">
								{sortedJoinedGroups.length > 0 && (
									<div className="mb-4">
										<h4 className="text-xs font-medium text-muted-foreground mb-2 px-1">Joined Groups</h4>
										<GroupsList
											groups={sortedJoinedGroups}
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
											onClickGroupMember={handleGroupMemberClick}
										/>
									</div>
								)}
								
								{sortedAvailableGroups.length > 0 && (
									<div>
										<h4 className="text-xs font-medium text-muted-foreground mb-2 px-1">Available Groups</h4>
										<GroupsList 
											groups={sortedAvailableGroups}
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
											showJoinOnHover={true}
										/>
									</div>
								)}
							</ScrollArea>
						)}
					</div>

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
							onDeleteGroup={() => handleDeleteGroup(activeChat)}
							onLeaveGroup={() => leaveGroup(activeChat)}
						/>

						{activeChat.id && activeChat.type === "group" && (
							<div className="border-b px-4 py-2">
								<div className="flex flex-wrap gap-1">
									<span className="text-xs text-muted-foreground">Members:</span>
									{activeGroupMemberObjects.map((member) => (
										<button
											key={member.id}
											onClick={() => handleGroupMemberClick(member)}
											className="text-xs px-2 py-1 bg-secondary rounded-full hover:bg-primary/10 transition-colors"
										>
											{member.name}
											{member.id === clientId && (
												<span className="ml-1 text-xs">
                          <Flag className="h-3 w-3 inline mr-0.5" />
                          [You]
                        </span>
											)}
										</button>
									))}
								</div>
							</div>
						)}

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
								
								<div className="px-4 h-6 text-xs text-muted-foreground">
									{/* This would show typing indicators */}
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
