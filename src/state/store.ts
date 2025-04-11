
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Define the message type
export interface ChatMessage {
  id: string;
  from: string;
  content: string;
  timestamp: number;
  isPrivate: boolean;
  to?: string; // For private messages or group name
}

// Define chat group type
export interface ChatGroup {
  name: string;
  members: string[];
}

// Define our state interface
interface ChatState {
  // Client information
  clientName: string;
  setClientName: (name: string) => void;
  
  // Connected clients
  connectedClients: string[];
  
  // Chat groups
  availableGroups: ChatGroup[];
  createGroup: (name: string) => void;
  joinGroup: (groupName: string) => void;
  leaveGroup: (groupName: string) => void;
  
  // Chat messages
  messages: ChatMessage[];
  sendMessage: (content: string, to: string) => void;
  
  // Socket connection
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

// Socket server URL - replace with your actual server URL when deployed
const SOCKET_SERVER_URL = 'http://localhost:3001';

export const useChatStore = create<ChatState>((set, get) => ({
  // Client name state
  clientName: localStorage.getItem('clientName') || '',
  setClientName: (name: string) => {
    localStorage.setItem('clientName', name);
    set({ clientName: name });
    
    // If we're already connected, update the name on the server
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('updateName', name);
    }
  },
  
  // Connected clients state
  connectedClients: [],
  
  // Chat groups state
  availableGroups: [],
  createGroup: (name: string) => {
    const { socket, clientName, availableGroups } = get();
    
    // Check if group already exists
    if (availableGroups.some(group => group.name === name)) {
      console.warn(`Group ${name} already exists`);
      return;
    }
    
    // Create locally first
    set(state => ({
      availableGroups: [
        ...state.availableGroups,
        { name, members: [clientName] }
      ]
    }));
    
    // Emit to server if connected
    if (socket && socket.connected) {
      socket.emit('createGroup', { name, creator: clientName });
    }
  },
  
  joinGroup: (groupName: string) => {
    const { socket, clientName, availableGroups } = get();
    
    // Update local state
    set(state => ({
      availableGroups: state.availableGroups.map(group => 
        group.name === groupName && !group.members.includes(clientName)
          ? { ...group, members: [...group.members, clientName] }
          : group
      )
    }));
    
    // Emit to server
    if (socket && socket.connected) {
      socket.emit('joinGroup', { groupName, client: clientName });
    }
  },
  
  leaveGroup: (groupName: string) => {
    const { socket, clientName } = get();
    
    // Update local state
    set(state => ({
      availableGroups: state.availableGroups.map(group => 
        group.name === groupName
          ? { ...group, members: group.members.filter(m => m !== clientName) }
          : group
      )
    }));
    
    // Emit to server
    if (socket && socket.connected) {
      socket.emit('leaveGroup', { groupName, client: clientName });
    }
  },
  
  // Messages state
  messages: [],
  sendMessage: (content: string, to: string) => {
    const { socket, clientName, availableGroups } = get();
    
    if (!socket || !socket.connected) {
      console.error('Cannot send message: Socket not connected');
      return;
    }
    
    // Check if sending to a group or private
    const isGroup = availableGroups.some(group => group.name === to);
    
    const messageData = {
      id: uuidv4(),
      content,
      from: clientName,
      isPrivate: !isGroup,
      to,
      timestamp: Date.now()
    };
    
    // Add message to local state immediately for UI responsiveness
    set(state => ({
      messages: [...state.messages, messageData]
    }));
    
    // Send to server
    if (isGroup) {
      socket.emit('groupMessage', messageData);
    } else {
      socket.emit('privateMessage', messageData);
    }
  },
  
  // Socket state
  socket: null,
  isConnected: false,
  
  connect: () => {
    // Check if already connected
    if (get().socket?.connected) return;
    
    // Create a new socket connection
    const socket = io(SOCKET_SERVER_URL, {
      autoConnect: true,
      reconnection: true,
    });
    
    // Handle connection
    socket.on('connect', () => {
      console.log('Connected to socket server');
      set({ isConnected: true });
      
      // Send current name if it exists
      const { clientName } = get();
      if (clientName) {
        socket.emit('updateName', clientName);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      set({ isConnected: false });
    });
    
    // Handle client list updates
    socket.on('clients', (clients: string[]) => {
      set({ connectedClients: clients });
    });
    
    // Handle group list updates
    socket.on('groups', (groups: ChatGroup[]) => {
      set({ availableGroups: groups });
    });
    
    // Handle incoming messages (both private and group)
    socket.on('messageReceived', (message: ChatMessage) => {
      set(state => ({ 
        messages: [...state.messages, message] 
      }));
    });
    
    // Save socket to state
    set({ socket });
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));
