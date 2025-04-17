
import React from 'react';
import { Chat, Client } from '@/state/store';
import { formatDistanceToNow } from 'date-fns';
import { Flag } from 'lucide-react';

interface RecentChatsProps {
  recentChats: Chat[];
  activeChat: Chat;
  onlineUsers: Client[];
  onChatSelect: (chat: Chat) => void;
  currentUserId: string;
}

const RecentChats: React.FC<RecentChatsProps> = ({ 
  recentChats, 
  activeChat, 
  onlineUsers,
  onChatSelect,
  currentUserId
}) => {
  if (recentChats.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No recent conversations</p>
      </div>
    );
  }

  // Function to check if a user is online
  const isUserOnline = (userId: string) => {
    return onlineUsers.some(user => user.id === userId);
  };

  // Handle click - if clicking on the current active chat, clear it
  const handleChatClick = (chat: Chat) => {
    if (activeChat.id === chat.id && activeChat.type === chat.type) {
      // Clear active chat by passing an empty chat
      onChatSelect({ id: "", name: "", type: null });
    } else {
      onChatSelect(chat);
    }
  };

  return (
    <div className="space-y-1">
      {recentChats.map((chat) => (
        <div
          key={`${chat.type}-${chat.id}`}
          onClick={() => handleChatClick(chat)}
          className={`p-2 rounded-md cursor-pointer flex items-start gap-2 transition-colors ${
            activeChat.id === chat.id && activeChat.type === chat.type
              ? "bg-lime-600/20"
              : "hover:bg-lime-600/10"
          }`}
        >
          <div className={`h-2 w-2 mt-2 rounded-full ${
            chat.type === 'private' && isUserOnline(chat.id) 
              ? "bg-green-500" 
              : "bg-gray-400"
          }`}></div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <span className="font-medium">
                {chat.name}
                {chat.id === currentUserId && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    <Flag className="h-3 w-3 inline mr-0.5" />[You]
                  </span>
                )}
              </span>
              {chat.lastMessage?.timestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: true })}
                </span>
              )}
            </div>
            {chat.lastMessage && (
              <div className="text-xs text-muted-foreground truncate">
                {chat.lastMessageSender && <span className="font-medium">{chat.lastMessageSender}: </span>}
                {chat.lastMessage.content}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentChats;
