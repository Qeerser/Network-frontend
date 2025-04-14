
import React from 'react';
import { Chat } from '@/state/store';
import { formatDistanceToNow } from 'date-fns';

interface RecentChatsProps {
  recentChats: Chat[];
  activeChat: Chat;
  onChatSelect: (chat: Chat) => void;
}

const RecentChats: React.FC<RecentChatsProps> = ({ recentChats, activeChat, onChatSelect }) => {
  if (recentChats.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No recent conversations</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recentChats.map((chat) => (
        <div
          key={`${chat.type}-${chat.id}`}
          onClick={() => onChatSelect(chat)}
          className={`p-2 rounded-md cursor-pointer flex items-start gap-2 transition-colors ${
            activeChat.id === chat.id && activeChat.type === chat.type
              ? "bg-lime-600/20"
              : "hover:bg-lime-600/10"
          }`}
        >
          <div className="h-2 w-2 mt-2 rounded-full bg-green-500"></div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <span className="font-medium">{chat.name}</span>
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
