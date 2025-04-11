
import React from 'react';
import { formatDistance } from 'date-fns';
import { ChatMessage as ChatMessageType } from '@/state/store';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  const formattedTime = formatDistance(
    new Date(message.timestamp),
    new Date(),
    { addSuffix: true }
  );

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[70%] rounded-lg p-3 ${
          isOwnMessage 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-secondary text-secondary-foreground'
        }`}
      >
        {!isOwnMessage && (
          <p className="text-xs font-medium mb-1">{message.from}</p>
        )}
        <p className="text-sm break-words">{message.content}</p>
        <span className="text-xs opacity-70 block text-right mt-1">
          {formattedTime}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
