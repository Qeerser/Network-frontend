
import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/state/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ChatClients: React.FC = () => {
  const { 
    clientName, 
    setClientName,
    connect,
    disconnect,
    isConnected
  } = useChatStore();
  
  const [nameInput, setNameInput] = useState(clientName);
  const [newGroupName, setNewGroupName] = useState('');

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
