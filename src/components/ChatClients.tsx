
import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/state/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ChatClients: React.FC = () => {
  const { 
    clientName, 
    setClientName, 
    connectedClients, 
    connect,
    disconnect,
    isConnected 
  } = useChatStore();
  
  const [nameInput, setNameInput] = useState(clientName);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
        <form onSubmit={handleSetName} className="flex gap-2">
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
            className="flex-1"
          />
          <Button type="submit" disabled={!nameInput.trim()}>
            {clientName ? 'Update' : 'Set'} Name
          </Button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Users ({connectedClients.length})</h2>
        {isConnected ? (
          <ul className="space-y-2">
            {connectedClients.length > 0 ? (
              connectedClients.map((client, index) => (
                <li 
                  key={index} 
                  className={`p-2 rounded-md ${client === clientName ? 'bg-primary/10' : 'bg-secondary/20'}`}
                >
                  {client} {client === clientName && <span className="text-xs">(you)</span>}
                </li>
              ))
            ) : (
              <p className="text-muted-foreground">No connected users</p>
            )}
          </ul>
        ) : (
          <div className="text-amber-600">
            Not connected to the chat server
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatClients;
