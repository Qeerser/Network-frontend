
import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/state/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, User, Plus } from 'lucide-react';

const ChatClients: React.FC = () => {
  const { 
    clientName, 
    setClientName, 
    connectedClients, 
    connect,
    disconnect,
    isConnected,
    availableGroups,
    joinGroup,
    createGroup
  } = useChatStore();
  
  const [nameInput, setNameInput] = useState(clientName);
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);

  useEffect(() => {
    // Connect to socket when component mounts
    connect();
    
    // Disconnect when unmounting
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setClientName(nameInput.trim());
      setShowNewGroupInput(false);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      createGroup(newGroupName.trim());
      setNewGroupName('');
      setShowNewGroupInput(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="font-bold">
        ChopKhui
      </div>
      <form onSubmit={handleSetName} className="flex gap-2">
        <Input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Enter your name"
          className="flex-1"
        />
        <Button type="submit" disabled={!nameInput.trim()}>
          {clientName ? 'Update' : 'Set'}
        </Button>
      </form>
    </div>
  );
};

export default ChatClients;
