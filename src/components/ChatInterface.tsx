import React, { useState, useEffect, useRef, useCallback, act } from "react";
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
	Moon,
	Sun,
	RefreshCw,
	Loader,
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
	const { theme, toggleTheme } = useTheme();
	const { logout, currentUser } = useAuthStore();
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
		availableGroups,
		activeChat,
		setActiveChat,
		clearActiveChat,
		clearChatMessages,
		fetchMessages,
	} = useChatStore();

	const [messageText, setMessageText] = useState("");
	const [chatType, setChatType] = useState<"private" | "group">("group");
	const [newGroupName, setNewGroupName] = useState("");
	const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [imageAttachment, setImageAttachment] = useState<string | null>(null);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [oldestMessageTime, setOldestMessageTime] = useState<Record<string, number>>({});
	const imageInputRef = useRef<HTMLInputElement>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	// Handle logout
	const handleLogout = () => {
		logout();
		navigate("/login");
	};
	const handleFetchMessages = useCallback(
		(chatId: string, type: "private" | "group") => {
			setLoadingMessages(true);
			fetchMessages(chatId, type,10);
			// Simulate API call with setTimeout
			setTimeout(() => {
				setLoadingMessages(false);

				// Store the oldest message time for this chat
				const chatMessages = messages.filter((msg) => {
					if (type === "private") {
						return (
							(msg.from === chatId && msg.to === clientName) ||
							(msg.from === clientName && msg.to === chatId)
						);
					} else {
						return msg.to === chatId && !msg.isPrivate;
					}
				});

				if (chatMessages.length > 0) {
					// Find oldest message
					const oldest = chatMessages.reduce((prev, curr) => (prev.timestamp < curr.timestamp ? prev : curr));

					setOldestMessageTime((prev) => ({
						...prev,
						[`${type}-${chatId}`]: oldest.timestamp,
					}));
				}
			}, 500); // Simulate network delay
		},
		[messages, clientName]
	);

	// Set active chat when selected chat changes
	useEffect(() => {
		if (activeChat.id) {
			setActiveChat(activeChat);
			// Simulate fetching messages for the selected chat
		}
	}, [activeChat, chatType, setActiveChat]);

	useEffect(() => {
		if (activeChat.id) {
			handleFetchMessages(activeChat.id, activeChat.type);
		}
	}, [activeChat]);

	// Simulate fetching older messages

	// Load more messages when scrolling to the top
	// const handleScroll = useCallback(
	// 	(event: React.UIEvent<HTMLDivElement>) => {
  //     console.log("Scroll event triggered");
	// 		const target = event.target as HTMLDivElement;

	// 		// If scrolled to the top (or near), load more messages
	// 		if (target.scrollTop < 3 && !loadingMessages && activeChat.id) {
	// 			const oldestTime = oldestMessageTime[`${activeChat.type}-${activeChat.name}`] || Date.now();
  //       fetchMessages(activeChat.id, activeChat.type);
	// 			setLoadingMessages(true);
	// 			// Simulate loading older messages
	// 			setTimeout(() => {
	// 				setLoadingMessages(false);

	// 				// Update oldest message time to be even older (simulate pagination)
	// 				setOldestMessageTime((prev) => ({
	// 					...prev,
	// 					[`${activeChat.type}-${activeChat.name}`]: oldestTime - 86400000, // 24 hours older
	// 				}));
	// 			}, 1000);
	// 		}
	// 	},
	// 	[activeChat, loadingMessages, oldestMessageTime]
	// );

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      console.log("Scroll event triggered");
    }

	// Handle tab change
	const handleTabChange = (value: string) => {
		// When switching tab types, leave the current room if we're in a group
		console.log("Tab changed to:", value);
		if (chatType === "group" && activeChat.id && value === "private") {
			leaveChat();
		}

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

	// Auto scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [sortedMessages.length]);

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
		const targetGroup = availableGroups.find((g) => g.name === group.name);
		if (targetGroup?.creator === clientName) {
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
										<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
												<Button type="submit">Create Group</Button>
											</DialogFooter>
										</form>
									</DialogContent>
								</Dialog>
							)}

							{/* Clear chat button */}
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClearChat}>
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
														className={`p-2 rounded-md cursor-pointer flex items-center gap-2 ${
															activeChat.id === client.id && chatType === "private"
																? "bg-primary/10"
																: "hover:bg-secondary/20"
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
														className={`p-2 rounded-md cursor-pointer flex items-center gap-2 opacity-60 ${
															activeChat.id === client.id && chatType === "private"
																? "bg-primary/10"
																: "hover:bg-secondary/20"
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
												key={group.name}
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
												className={`p-2 rounded-md cursor-pointer ${
													activeChat.name === group.name && chatType === "group"
														? "bg-primary/10"
														: "hover:bg-secondary/20"
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
															{group.members.includes(clientName) ? (
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
															) : (
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

															{group.creator === clientName && (
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
							<div className=" justify-center p-4 pb-0">
								<div className=" pb-2 border-b flex justify-between items-center">
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
												{/* Leave group button */}
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleLeaveGroup(activeChat)}
													className="h-8"
												>
													<LogOut size={14} className="mr-1" /> Leave
												</Button>

												{/* Delete group button (if creator) */}
												{availableGroups.find((g) => g.id === activeChat.id)?.creator ===
													clientName && (
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleDeleteGroup(activeChat)}
														className="h-8"
													>
														<Trash2 size={14} className="mr-1" /> Delete
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

						<ScrollArea className="flex-1 p-4 pt-0" ref={scrollAreaRef} onScroll={handleScroll}>
							{loadingMessages && (
								<div className="flex justify-center py-3">
									<Loader className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							)}
							{activeChat.id && (
								<div className="">
									{sortedMessages.length > 0 ? (
										<div className="space-y-3">
											{sortedMessages.map((msg) => (
												<ChatMessage
													key={msg.id}
													message={msg}
													isOwnMessage={msg.from === clientName}
													onEditMessage={msg.from === clientName ? editMessage : undefined}
													onReactMessage={reactToMessage}
												/>
											))}
											<div ref={messagesEndRef} />
										</div>
									) : (
										<div className="h-full flex items-center justify-center">
											<p className="text-muted-foreground text-center">
												{chatType === "private"
													? `Start a conversation with ${activeChat.name}`
													: `Start chatting in ${activeChat.name}`}
											</p>
										</div>
									)}
								</div>
							)}
						</ScrollArea>

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
										className="h-10 w-10 p-0"
									>
										<Smile size={20} />
									</Button>

									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={() => imageInputRef.current?.click()}
										className="h-10 w-10 p-0"
									>
										<Image size={20} />
									</Button>

									<Button type="submit" size="sm" disabled={!messageText.trim() && !imageAttachment}>
										<Send size={16} className="mr-2" /> Send
									</Button>
								</form>
							</div>
						)}
					</div>
				</div>
			</Tabs>
		</div>
	);
};

export default ChatInterface;
