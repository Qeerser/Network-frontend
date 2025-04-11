
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Define the message type
export interface ChatMessage {
  id: string;
  from: string;
  content: string;
  timestamp: number;
  isPrivate: boolean;
  to?: string; // For private messages
}

// Define our state interface
interface ChatState {
  // Client information
  clientName: string;
  setClientName: (name: string) => void;
  
  // Connected clients
  connectedClients: string[];
  
  // Chat messages
  messages: ChatMessage[];
  sendMessage: (content: string, to?: string) => void;
  
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
  
  // Messages state
  messages: [],
  sendMessage: (content: string, to?: string) => {
    const { socket, clientName } = get();
    
    if (!socket || !socket.connected) {
      console.error('Cannot send message: Socket not connected');
      return;
    }
    
    const messageData = {
      content,
      from: clientName,
      isPrivate: !!to,
      to
    };
    
    // Send to server
    if (to) {
      socket.emit('privateMessage', messageData);
    } else {
      socket.emit('message', messageData);
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
    
    // Handle incoming messages
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
