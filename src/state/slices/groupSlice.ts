
import { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";
import { Chat, ChatGroup, ChatState } from "../types/chatTypes";

export interface GroupSlice {
	availableGroups: ChatGroup[];
	createGroup: (name: string) => Chat;
	joinGroup: (targetGroup: Chat) => void;
	leaveGroup: (targetGroup: Chat) => void;
	deleteGroup: (targetGroup: Chat) => void;
	renameGroup: (targetGroup: Chat, newName: string) => void;
}

export const createGroupSlice: StateCreator<
	ChatState,
	[],
	[],
	GroupSlice
> = (set, get, api) => ({
	availableGroups: [],
	
	createGroup: (name: string): Chat => {
		const { socket, clientName, clientId, availableGroups } = get();
		const groupId = uuidv4();
		
		get().setFetchedChats(`group-${groupId}`, true);
		
		if (availableGroups.some((group) => group.name === name)) {
			console.warn(`Group ${name} already exists`);
			return { id: "", name: "", type: null };
		}
		
		const newGroup: ChatGroup = {
			id: groupId,
			name,
			members: [clientName],
			memberIds: [clientId],
			creator: clientName,
			creatorId: clientId,
		};

		set((state) => ({
			availableGroups: [...state.availableGroups, newGroup],
		}));

		if (socket && socket.connected) {
			socket.emit("createGroup", newGroup);
		}
		
		return { id: groupId, name, type: "group" };
	},

	joinGroup: (targetGroup: Chat) => {
		const { socket, clientName, clientId } = get();

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
		const { socket, clientName, clientId, activeChat, availableGroups } = get();
		
		const group = availableGroups.find(g => g.id === targetGroup.id);
		if (group && (group.creator === clientName || group.creatorId === clientId)) {
			toast({
				title: "Cannot Leave Group",
				description: "As the creator, you can only delete this group.",
				variant: "destructive",
			});
			return;
		}

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

		if (activeChat.name === targetGroup.name && activeChat.type === "group") {
			get().clearActiveChat();
		}

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

		const group = get().availableGroups.find((g) => g.name === targetGroup.name);
		if (!group || (group.creator !== clientName && group.creatorId !== clientId)) {
			console.warn("You don't have permission to delete this group");
			return;
		}

		set((state) => ({
			availableGroups: state.availableGroups.filter((group) => group.name !== targetGroup.name),
		}));

		if (activeChat.name === targetGroup.name && activeChat.type === "group") {
			get().clearActiveChat();
		}

		if (socket && socket.connected) {
			socket.emit("deleteGroup", {
				groupId: targetGroup.id,
				client: clientId,
			});
		}
	},
	
	renameGroup: (targetGroup: Chat, newName: string) => {
		const { socket, clientName, clientId } = get();

		const group = get().availableGroups.find((g) => g.id === targetGroup.id);
		if (!group || (group.creator !== clientName && group.creatorId !== clientId)) {
			toast({
				title: "Permission Denied",
				description: "Only the creator can rename this group",
				variant: "destructive",
			});
			return;
		}
		
		set((state) => ({
			availableGroups: state.availableGroups.map((group) =>
				group.id === targetGroup.id
					? {
							...group,
							name: newName,
					  }
					: group
			),
			activeChat: state.activeChat.id === targetGroup.id 
				? { ...state.activeChat, name: newName }
				: state.activeChat
		}));

		if (socket && socket.connected) {
			socket.emit("renameGroup", {
				groupId: targetGroup.id,
				newName,
				clientId,
			});
		}
		
		toast({
			title: "Group Renamed",
			description: `Group renamed to "${newName}"`,
			variant: "default",
		});
	}
});
