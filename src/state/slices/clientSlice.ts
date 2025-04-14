
import { StateCreator } from "zustand";
import { ChatState, Client } from "../types/chatTypes";

export interface ClientSlice {
	clientName: string;
	clientId: string;
	connectedClients: Client[];
	offlineClients: Client[];
	setClientName: (name: string) => void;
	setClientId: (id: string) => void;
}

export const createClientSlice: StateCreator<
	ChatState,
	[],
	[],
	ClientSlice
> = (set, get, api) => ({
	clientName: "",
	clientId: "",
	connectedClients: [],
	offlineClients: [],
	
	setClientName: (name: string) => {
		set({ clientName: name });

		const { socket } = get();
		if (socket && socket.connected) {
			socket.emit("updateName", name);
		}
	},
	
	setClientId: (id: string) => {
		set({ clientId: id });
	}
});
