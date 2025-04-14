
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Chat, Client } from '@/state/store';
import { Users, User, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from './UsersList';
import RecentChats from './RecentChats';

interface UsersPanelProps {
  onlineUsers: Client[];
  offlineUsers: Client[];
  activeChat: Chat;
  recentPrivateChats: Chat[];
  onUserSelect: (user: Client) => void;
  onChatSelect: (chat: Chat) => void;
}

const UsersPanel: React.FC<UsersPanelProps> = ({
  onlineUsers,
  offlineUsers,
  activeChat,
  recentPrivateChats,
  onUserSelect,
  onChatSelect
}) => {
  const [usersTab, setUsersTab] = useState<string>("recent");
  
  return (
    <div className="h-full flex flex-col">
      <Tabs value={usersTab} onValueChange={setUsersTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="recent" className="flex items-center gap-1">
            <Clock size={14} /> Recent
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Users size={14} /> All Users
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1 h-[calc(100%-40px)]">
          <TabsContent value="recent" className="mt-0 h-full">
            <RecentChats 
              recentChats={recentPrivateChats}
              activeChat={activeChat}
              onChatSelect={onChatSelect}
            />
          </TabsContent>
          
          <TabsContent value="all" className="mt-0 h-full">
            <UsersList 
              onlineUsers={onlineUsers}
              offlineUsers={offlineUsers}
              activeChat={activeChat}
              onUserSelect={onUserSelect}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default UsersPanel;
