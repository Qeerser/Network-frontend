
import React, { useState } from 'react';
import { formatDistance } from 'date-fns';
import { ChatMessage as ChatMessageType } from '@/state/store';
import { Button } from '@/components/ui/button';
import { Edit, Smile, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from './ui/input';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
  onEditMessage?: (id: string, newContent: string) => void;
  onReactMessage?: (id: string, reaction: string) => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😄', '😮', '😢', '👀'];

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isOwnMessage,
  onEditMessage,
  onReactMessage
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  
  const formattedTime = formatDistance(
    new Date(message.timestamp),
    new Date(),
    { addSuffix: true }
  );

  const handleSaveEdit = () => {
    if (editedContent.trim() && onEditMessage) {
      onEditMessage(message.id, editedContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };
  
  const handleReaction = (reaction: string) => {
    if (onReactMessage) {
      onReactMessage(message.id, reaction);
    }
  };

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
        
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Input
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="text-sm text-foreground bg-background"
              autoFocus
            />
            <div className="flex justify-end gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancelEdit} 
                className="h-6 w-6 p-0">
                <X size={14} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSaveEdit} 
                className="h-6 w-6 p-0">
                <Check size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm break-words">
              {message.content}
              {message.image && (
                <img 
                  src={message.image} 
                  alt="Message attachment" 
                  className="mt-2 max-w-full rounded shadow-[var(--pixel-shadow)]"
                />
              )}
            </p>
            
            {/* Message reaction display - single emoji */}
            {message.reactions && (
              <div className="mt-2">
                <span 
                  className="inline-block bg-background/20 rounded px-1.5 py-0.5 text-xs"
                >
                  {message.reactions}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs opacity-70 block">
                {formattedTime}
              </span>
              
              <div className="flex gap-1">
                {/* Reactions dropdown */}
                {onReactMessage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                      >
                        <Smile size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="grid grid-cols-3 p-1">
                      {EMOJI_REACTIONS.map(emoji => (
                        <DropdownMenuItem 
                          key={emoji} 
                          onClick={() => handleReaction(emoji)}
                          className="px-2 py-1 flex justify-center items-center hover:bg-accent"
                        >
                          {emoji}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {/* Edit button (only for own messages) */}
                {isOwnMessage && onEditMessage && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  >
                    <Edit size={14} />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
