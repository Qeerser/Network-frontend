
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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
  isInGroup: boolean;
  onEditMessage?: (id: string, newContent: string) => void;
  onReactMessage?: (id: string, reaction: string) => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😄', '😮', '😢', '👀'];

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isOwnMessage,
  isInGroup,
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

  // Generate initials from name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group mb-2`}>
      {/* Avatar (only show for other users' messages) */}
      {!isOwnMessage && (
        <div className="self-start mr-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.fromId}`} />
            <AvatarFallback className="bg-lime-600 text-white text-xs">
              {getInitials(message.from)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className="flex flex-col max-w-[70%]">
        {/* Message content */}
        <div 
          className={`rounded-lg p-3 ${
            isOwnMessage 
              ? 'bg-lime-600 text-white rounded-tr-none ml-auto' 
              : 'bg-background border border-border rounded-tl-none'
          }`}
        >
          {/* Display sender name in group chats for others' messages */}
          {isInGroup && !isOwnMessage && (
            <p className="text-xs font-medium mb-1 text-lime-500">{message.from}</p>
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
            <div className="text-sm break-words">
              {message.content}
              {message.edited && (
                <span className="text-xs text-muted-foreground ml-2 opacity-70">
                  (edited)
                </span>
              )}
              {message.image && (
                <img 
                  src={message.image} 
                  alt="Message attachment" 
                  className="mt-2 max-w-full rounded shadow-[var(--pixel-shadow)]"
                />
              )}
            </div>
          )}
            
          {/* Message reaction display - single emoji */}
          {message.reactions && (
            <div className="mt-2">
              <span 
                className="inline-block bg-background/20 rounded-full px-2 py-0.5 text-xs"
              >
                {message.reactions}
              </span>
            </div>
          )}
        </div>
        
        {/* Timestamp and actions below the message bubble */}
        <div className={`flex justify-between items-center mt-1 px-1 text-xs text-muted-foreground ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="opacity-70">
            {formattedTime}
          </span>
          
          <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Reactions dropdown */}
            {onReactMessage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:opacity-100"
                  >
                    <span className="sr-only">React to message</span>
                    <Smile size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? "end" : "start"} className="grid grid-cols-3 p-1">
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
                className="h-6 w-6 p-0 hover:opacity-100"
              >
                <Edit size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
