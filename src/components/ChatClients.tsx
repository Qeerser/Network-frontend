
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
    <div className="space-y-4">
      <div className="mb-6">
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

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="users" className="flex items-center gap-1">
            <User size={16} /> Users
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1">
            <Users size={16} /> Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Online Users ({connectedClients.length})</h3>
            </div>
            
            {isConnected ? (
              <ScrollArea className="h-[250px]">
                <div className="space-y-1">
                  {connectedClients.length > 0 ? (
                    connectedClients.map((client, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded-lg flex items-center ${client === clientName ? 'bg-primary/10' : 'bg-secondary/20'}`}
                      >
                        <User size={16} className="mr-2 text-primary" />
                        <span>{client}</span>
                        {client === clientName && <span className="text-xs ml-2 text-muted-foreground">(you)</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No connected users</p>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-amber-600">
                Not connected to the chat server
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="mt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Available Groups ({availableGroups.length})</h3>
              {!showNewGroupInput && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowNewGroupInput(true)}
                  className="h-8 w-8 p-0"
                >
                  <Plus size={16} />
                </Button>
              )}
            </div>
            
            {showNewGroupInput && (
              <form onSubmit={handleCreateGroup} className="flex gap-2 mb-2">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={!newGroupName.trim()}>
                  Create
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowNewGroupInput(false)}
                >
                  Cancel
                </Button>
              </form>
            )}
            
            <ScrollArea className="h-[250px]">
              <div className="space-y-1">
                {availableGroups.length > 0 ? (
                  availableGroups.map((group, index) => (
                    <div 
                      key={index} 
                      className="p-2 rounded-lg bg-secondary/20 hover:bg-secondary/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users size={16} className="mr-2 text-primary" />
                          <span>{group.name}</span>
                        </div>
                        
                        {!group.members.includes(clientName) ? (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => joinGroup(group.name)}
                            className="h-7 px-2 text-xs"
                          >
                            Join
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Joined</span>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No groups available</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatClients;
