
import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/state/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Send, UserPlus, Users } from 'lucide-react';
import ChatMessage from './ChatMessage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

const ChatInterface: React.FC = () => {
  const { 
    clientName,
    connectedClients,
    messages,
    sendMessage,
    joinGroup,
    createGroup,
    leaveGroup,
    availableGroups,
  } = useChatStore();
  
  const [messageText, setMessageText] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatType, setChatType] = useState<'private' | 'group'>('private');
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Filter messages based on the selected chat and chat type
  const filteredMessages = messages.filter(msg => {
    if (chatType === 'private') {
      return (
        (msg.from === selectedChat && msg.to === clientName) ||
        (msg.from === clientName && msg.to === selectedChat)
      );
    } else {
      // Group messages
      return msg.to === selectedChat && !msg.isPrivate;
    }
  });
  
  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !selectedChat) return;
    
    sendMessage(messageText, selectedChat);
    setMessageText('');
    
    // Show toast for sent message
    toast({
      title: "Message Sent",
      description: `To: ${selectedChat}`,
      duration: 2000,
    });
  };
  
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newGroupName.trim()) {
      createGroup(newGroupName);
      setNewGroupName('');
      setShowNewGroupDialog(false);
      setChatType('group');
      
      toast({
        title: "Group Created",
        description: `"${newGroupName}" has been created`,
        variant: "default",
      });
    }
  };
  
  const handleJoinGroup = (groupName: string) => {
    joinGroup(groupName);
    setSelectedChat(groupName);
    
    toast({
      title: "Joined Group",
      description: `You have joined "${groupName}"`,
      variant: "default",
    });
  };
  
  const handleLeaveGroup = (groupName: string) => {
    leaveGroup(groupName);
    if (selectedChat === groupName) {
      setSelectedChat(null);
    }
    
    toast({
      title: "Left Group",
      description: `You have left "${groupName}"`,
      variant: "default",
    });
  };
  
  // Filter out the current user from the connected clients list
  const otherClients = connectedClients.filter(client => client !== clientName);

  return (
    <div className="flex flex-col h-[500px] border rounded-md overflow-hidden">
      <Tabs 
        defaultValue="private" 
        className="w-full h-full flex flex-col"
        onValueChange={(value) => setChatType(value as 'private' | 'group')}
      >
        <div className="border-b px-4">
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
              <h3 className="text-sm font-semibold">
                {chatType === 'private' ? 'Users' : 'Groups'}
              </h3>
              
              {chatType === 'group' && (
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
            </div>
            
            <ScrollArea className="flex-1">
              <TabsContent value="private" className="m-0 h-full">
                <ul className="space-y-2">
                  {otherClients.length > 0 ? (
                    otherClients.map((client) => (
                      <li 
                        key={client}
                        onClick={() => setSelectedChat(client)}
                        className={`p-2 rounded-md cursor-pointer ${
                          selectedChat === client ? 'bg-primary/10' : 'hover:bg-secondary/20'
                        }`}
                      >
                        {client}
                      </li>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No other users online</p>
                  )}
                </ul>
              </TabsContent>
              
              <TabsContent value="group" className="m-0 h-full">
                <ul className="space-y-2">
                  {availableGroups.length > 0 ? (
                    availableGroups.map((group) => (
                      <li 
                        key={group.name}
                        onClick={() => {
                          setSelectedChat(group.name);
                          if (!group.members.includes(clientName)) {
                            handleJoinGroup(group.name);
                          }
                        }}
                        className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${
                          selectedChat === group.name ? 'bg-primary/10' : 'hover:bg-secondary/20'
                        }`}
                      >
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
                              <DropdownMenuItem onClick={() => handleLeaveGroup(group.name)}>
                                Leave Group
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleJoinGroup(group.name)}>
                                Join Group
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            <ScrollArea className="flex-1 p-4">
              {selectedChat ? (
                <>
                  <div className="mb-4 pb-2 border-b">
                    <h3 className="font-semibold">
                      {chatType === 'private' ? `Chat with ${selectedChat}` : selectedChat}
                    </h3>
                    {chatType === 'group' && (
                      <p className="text-xs text-muted-foreground">
                        {availableGroups.find(g => g.name === selectedChat)?.members.join(', ')}
                      </p>
                    )}
                  </div>
                  
                  {filteredMessages.length > 0 ? (
                    <div className="space-y-3">
                      {filteredMessages.map((msg) => (
                        <ChatMessage
                          key={msg.id}
                          message={msg}
                          isOwnMessage={msg.from === clientName}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground text-center">
                        {chatType === 'private' 
                          ? `Start a conversation with ${selectedChat}` 
                          : `Start chatting in ${selectedChat}`}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    {chatType === 'private'
                      ? 'Select a user to start chatting'
                      : 'Select a group to join the conversation'}
                  </p>
                </div>
              )}
            </ScrollArea>
            
            {selectedChat && (
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${chatType === 'private' ? selectedChat : 'group'}`}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={!messageText.trim()}>
                  <Send size={16} className="mr-2" /> Send
                </Button>
              </form>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default ChatInterface;
