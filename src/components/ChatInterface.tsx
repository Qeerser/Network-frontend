
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chat, useChatStore } from "@/state/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "./ThemeProvider";
import { useAuthStore } from "@/state/authStore";
import { useNavigate } from "react-router-dom";
import {
	PlusCircle,
	Send,
	UserPlus,
	Users,
	Image,
	Smile,
	X,
	Trash2,
	LogOut,
	RefreshCw,
	Loader,
	ChevronUp,
	Edit,
} from "lucide-react";
import ChatMessage from "./ChatMessage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import EmojiPicker from "./EmojiPicker";

const ChatInterface: React.FC = () => {
	const { currentUser } = useAuthStore();
	const navigate = useNavigate();

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

	const [messageText, setMessageText] = useState("");
	const [chatType, setChatType] = useState<"private" | "group">("group");
	const [newGroupName, setNewGroupName] = useState("");
	const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
	const [showRenameGroupDialog, setShowRenameGroupDialog] = useState(false);
	const [renameGroupText, setRenameGroupText] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [imageAttachment, setImageAttachment] = useState<string | null>(null);
	
	const imageInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	// Handle tab change
	const handleTabChange = (value: string) => {
		console.log("Tab changed to:", value);
		setChatType(value as "private" | "group");
		clearActiveChat(); // Clear active chat when switching tabs
	};

	// Handle leaving chat
	const leaveChat = () => {
		if (activeChat.type === "group" && activeChat.id) {
			leaveGroup(activeChat);
		}
		clearActiveChat();
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
	}, [activeChat, fetchMessages]);

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

	// Handle scroll to load more messages
	const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
		const target = event.target as HTMLDivElement;
		const scrollContainer = target.querySelector('[data-radix-scroll-area-viewport]');
		
		if (!scrollContainer || isLoadingMessages || !activeChat.id) return;
		
		// Load more messages if scrolled to top (or near)
		if (scrollContainer.scrollTop < 20) {
			console.log("Scrolled to top, loading more messages");
			const chatKey = `${activeChat.type}-${activeChat.id}`;
			const beforeTimestamp = oldestMessageTimestamp[activeChat.id];
			
			if (beforeTimestamp) {
				fetchMessages(activeChat.id, activeChat.type, 10, beforeTimestamp);
			} else {
				fetchMessages(activeChat.id, activeChat.type, 10);
			}
		}
	}, [activeChat, isLoadingMessages, oldestMessageTimestamp, fetchMessages]);

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();

		if ((!messageText.trim() && !imageAttachment) || !activeChat.id) return;

		sendMessage(
			messageText,
			activeChat.name,
			activeChat.type === "private",
			activeChat.id,
			imageAttachment || undefined
		);
		setMessageText("");
		setImageAttachment(null);
		setShowEmojiPicker(false);

		// Show toast for sent message
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

	const handleJoinGroup = (group: Chat) => {
		joinGroup(group);
		setActiveChat(group);

		toast({
			title: "Joined Group",
			description: `You have joined "${group.name}"`,
			variant: "default",
		});
	};

	const handleLeaveGroup = (group: Chat) => {
		leaveGroup(group);

		toast({
			title: "Left Group",
			description: `You have left "${group.name}"`,
			variant: "default",
		});
	};

	const handleDeleteGroup = (group: Chat) => {
		const targetGroup = availableGroups.find((g) => g.id === group.id);
		if (targetGroup?.creator === clientName || targetGroup?.creatorId === clientId) {
			deleteGroup(group);
			toast({
				title: "Group Deleted",
				description: `"${group.name}" has been deleted`,
				variant: "destructive",
			});
		} else {
			toast({
				title: "Permission Denied",
				description: "You can only delete groups you created",
				variant: "destructive",
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

	const handleEmojiSelect = (emoji: string) => {
		setMessageText((prev) => prev + emoji);
		setShowEmojiPicker(false);
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				setImageAttachment(event.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveImage = () => {
		setImageAttachment(null);
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
		}
	};

	const handleScrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Filter out the current user from the connected clients list
	const otherClients = connectedClients.filter((client) => client.name !== clientName);

	// Sort users by last message interaction (for now just alphabetically)
	const sortedOtherClients = [...otherClients].sort((a, b) => a.name.localeCompare(b.name));

	// Get list of offline users
	const sortedOfflineClients = offlineClients ? [...offlineClients].sort((a, b) => a.name.localeCompare(b.name)) : [];

	// Sort groups by last message timestamp if available
	const sortedGroups = [...availableGroups].sort((a, b) => {
		if (a.lastMessage && b.lastMessage) {
			return b.lastMessage.timestamp - a.lastMessage.timestamp;
		}
		if (a.lastMessage) return -1;
		if (b.lastMessage) return 1;
		return a.name.localeCompare(b.name);
	});
	
	// Check if current user is creator of active group
	const isCreatorOfActiveGroup = activeChat.type === "group" && 
	                              availableGroups.some(g => 
	                                g.id === activeChat.id && 
	                                (g.creator === clientName || g.creatorId === clientId));

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

						<ScrollArea className="flex-1">
							<TabsContent value="private" className="m-0 h-full">
								<div className="space-y-4">
									{/* Online users */}
									<div>
										<h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">
											Online
										</h4>
										<ul className="space-y-2">
											{sortedOtherClients.length > 0 ? (
												sortedOtherClients.map((client) => (
													<li
														key={client.id}
														onClick={() =>
															setActiveChat({
																id: client.id,
																name: client.name,
																type: "private",
															})
														}
														className={`p-2 rounded-md cursor-pointer flex items-center gap-2 transition-colors ${
															activeChat.id === client.id && chatType === "private"
																? "bg-lime-600/20"
																: "hover:bg-lime-600/10"
														}`}
													>
														<span className="h-2 w-2 rounded-full bg-green-500"></span>
														<span>{client.name}</span>
													</li>
												))
											) : (
												<p className="text-muted-foreground text-sm">No other users online</p>
											)}
										</ul>
									</div>

									{/* Offline users */}
									{sortedOfflineClients.length > 0 && (
										<div>
											<h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">
												Offline
											</h4>
											<ul className="space-y-2">
												{sortedOfflineClients.map((client) => (
													<li
														key={client.id}
														onClick={() =>
															setActiveChat({
																id: client.id,
																name: client.name,
																type: "private",
															})
														}
														className={`p-2 rounded-md cursor-pointer flex items-center gap-2 opacity-60 transition-colors ${
															activeChat.id === client.id && chatType === "private"
																? "bg-lime-600/20"
																: "hover:bg-lime-600/10"
														}`}
													>
														<span className="h-2 w-2 rounded-full bg-gray-400"></span>
														<span>{client.name}</span>
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
							</TabsContent>

							<TabsContent value="group" className="m-0 h-full">
								<ul className="space-y-2">
									{sortedGroups.length > 0 ? (
										sortedGroups.map((group) => (
											<li
												key={group.id}
												onClick={() => {
													setActiveChat({ id: group.id, name: group.name, type: "group" });
													if (!group.members.includes(clientName)) {
														handleJoinGroup({
															id: group.id,
															name: group.name,
															type: "group",
														});
													}
												}}
												className={`p-2 rounded-md cursor-pointer transition-colors ${
													activeChat.id === group.id && chatType === "group"
														? "bg-lime-600/20"
														: "hover:bg-lime-600/10"
												}`}
											>
												<div className="flex justify-between items-center">
													<span>{group.name}</span>

													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="sm" className="h-6 w-6 p-0">
																<span className="sr-only">Open menu</span>
																<Users size={12} />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															{group.members.includes(clientName) && !isCreatorOfActiveGroup && (
																<DropdownMenuItem
																	onClick={(e) => {
																		e.stopPropagation();
																		handleLeaveGroup({
																			id: group.id,
																			name: group.name,
																			type: "group",
																		});
																	}}
																>
																	<LogOut className="mr-2 h-4 w-4" />
																	Leave Group
																</DropdownMenuItem>
															)}
															
															{!group.members.includes(clientName) && (
																<DropdownMenuItem
																	onClick={(e) => {
																		e.stopPropagation();
																		handleJoinGroup({
																			id: group.id,
																			name: group.name,
																			type: "group",
																		});
																	}}
																>
																	<UserPlus className="mr-2 h-4 w-4" />
																	Join Group
																</DropdownMenuItem>
															)}

															{(group.creator === clientName || group.creatorId === clientId) && (
																<>
																	<DropdownMenuItem
																		onClick={(e) => {
																			e.stopPropagation();
																			setRenameGroupText(group.name);
																			setActiveChat({ id: group.id, name: group.name, type: "group" });
																			setShowRenameGroupDialog(true);
																		}}
																	>
																		<Edit className="mr-2 h-4 w-4" />
																		Rename Group
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={(e) => {
																			e.stopPropagation();
																			handleDeleteGroup({
																				id: group.id,
																				name: group.name,
																				type: "group",
																			});
																		}}
																		className="text-destructive"
																	>
																		<Trash2 className="mr-2 h-4 w-4" />
																		Delete Group
																	</DropdownMenuItem>
																</>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												</div>

												{/* Last message preview */}
												{group.lastMessage && (
													<p className="text-xs text-muted-foreground mt-1 truncate">
														{group.lastMessage.content}
													</p>
												)}

												<div className="text-xs text-muted-foreground mt-1">
													{group.members.length} members
												</div>
											</li>
										))
									) : (
										<p className="text-muted-foreground text-sm">No groups available</p>
									)}
								</ul>
							</TabsContent>
						</ScrollArea>
					</div>

					{/* Chat Area */}
					<div className="flex-1 flex flex-col">
						{activeChat.id ? (
							<div className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
								<div className="flex justify-between items-center">
									<div>
										<h3 className="font-semibold">
											{chatType === "private" ? `Chat with ${activeChat.name}` : activeChat.name}
										</h3>
										{chatType === "group" && (
											<p className="text-xs text-muted-foreground">
												{availableGroups
													.find((g) => g.id === activeChat.id)
													?.members.join(", ")}
											</p>
										)}
									</div>

									{/* Action buttons */}
									<div className="flex gap-2">
										{chatType === "group" && (
											<>
												{/* Group action buttons */}
												{isCreatorOfActiveGroup ? (
													<>
														{/* Rename group button */}
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setRenameGroupText(activeChat.name);
																setShowRenameGroupDialog(true);
															}}
															className="h-8 hover:bg-lime-600/10 hover:text-lime-600 transition-colors"
														>
															<Edit size={14} className="mr-1" /> Rename
														</Button>

														{/* Delete group button */}
														<Button
															variant="destructive"
															size="sm"
															onClick={() => handleDeleteGroup(activeChat)}
															className="h-8"
														>
															<Trash2 size={14} className="mr-1" /> Delete
														</Button>
													</>
												) : (
													/* Leave group button (only for non-creators) */
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleLeaveGroup(activeChat)}
														className="h-8 hover:bg-lime-600/10 hover:text-lime-600 transition-colors"
													>
														<LogOut size={14} className="mr-1" /> Leave
													</Button>
												)}
											</>
										)}
									</div>
								</div>
							</div>
						) : (
							<div className="h-full flex items-center justify-center">
								<p className="text-muted-foreground text-center">
									{chatType === "private"
										? "Select a user to start chatting"
										: "Select a group to join the conversation"}
								</p>
							</div>
						)}

						<div className="flex-1 px-4 relatve overflow-y-auto flex flex-col-reverse justify-content-end" onScrollCapture={handleScroll}>
							{isLoadingMessages && (
								<div className="flex justify-center py-3">
									<Loader className="h-5 w-5 animate-spin text-lime-500" />
								</div>
							)}
							{activeChat.id && (
								<div className="flex flex-col space-y-3">
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
										<div className="h-full flex items-center justify-center">
											<p className="text-muted-foreground text-center">
												{chatType === "private"
													? `Start a conversation with ${activeChat.name}`
													: `Start chatting in ${activeChat.name}`}
											</p>
										</div>
									)}
									<div ref={messagesEndRef} />
								</div>
							)}
							
							{/* Scroll to bottom button - uncomment if needed */}
							{/* {activeChat.id && sortedMessages.length > 10 && (
								<Button 
									onClick={handleScrollToBottom} 
									size="sm"
									className="rounded-full fixed bottom-24 right-8 shadow-md bg-lime-600 hover:bg-lime-700"
								>
									<ChevronUp size={16} />
								</Button>
							)} */}
						</div>
						
						{activeChat.id && (
							<div className="p-4 border-t">
								{/* Image preview */}
								{imageAttachment && (
									<div className="mb-2 relative">
										<img
											src={imageAttachment}
											alt="Attachment preview"
											className="h-24 object-contain rounded border shadow-[var(--pixel-shadow)]"
										/>
										<Button
											variant="destructive"
											size="sm"
											onClick={handleRemoveImage}
											className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
										>
											<X size={12} />
										</Button>
									</div>
								)}

								{/* Emoji picker */}
								{showEmojiPicker && (
									<div className="mb-2">
										<EmojiPicker onEmojiSelect={handleEmojiSelect} />
									</div>
								)}

								<form onSubmit={handleSendMessage} className="flex gap-2">
									{/* Hidden file input */}
									<input
										type="file"
										accept="image/*"
										onChange={handleImageUpload}
										style={{ display: "none" }}
										ref={imageInputRef}
									/>

									<Input
										value={messageText}
										onChange={(e) => setMessageText(e.target.value)}
										placeholder={`Message ${chatType === "private" ? activeChat.name : "group"}`}
										className="flex-1"
									/>

									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={() => setShowEmojiPicker(!showEmojiPicker)}
										className="h-10 w-10 p-0 hover:bg-lime-600/10 transition-colors"
									>
										<Smile size={20} />
									</Button>

									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={() => imageInputRef.current?.click()}
										className="h-10 w-10 p-0 hover:bg-lime-600/10 transition-colors"
									>
										<Image size={20} />
									</Button>

									<Button 
										type="submit" 
										size="sm" 
										disabled={!messageText.trim() && !imageAttachment}
										className="bg-lime-600 hover:bg-lime-700 transition-colors"
									>
										<Send size={16} className="mr-2" /> Send
									</Button>
								</form>
							</div>
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
