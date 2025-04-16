
import React, { useState } from 'react';
import { ChatMessage as MessageType } from '@/state/store';
import { Pencil, Smile, CheckCheck } from 'lucide-react';
import { formatRelative } from 'date-fns';
import EmojiPicker from './EmojiPicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatMessageProps {
  message: MessageType;
  isOwnMessage: boolean;
  isInGroup: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onReactMessage?: (messageId: string, reaction: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isOwnMessage, 
  isInGroup,
  onEditMessage,
  onReactMessage 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEditMessage && editedContent.trim()) {
      onEditMessage(message.id, editedContent);
      setIsEditing(false);
    }
  };

  const handleReaction = (emoji: string) => {
    if (onReactMessage) {
      onReactMessage(message.id, emoji);
      setShowEmojiPicker(false);
    }
  };

  const messageDate = new Date(message.timestamp);
  const formattedDate = formatRelative(messageDate, new Date());

  // Get all reactions as array for easier rendering
  const reactionsArray = message.reactions 
    ? Object.entries(message.reactions).map(([emoji, users]) => ({ emoji, users }))
    : [];
  
  return (
    <div className={`flex gap-2 relative group ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Message actions - positioned above the message for better alignment */}
      <div className={`absolute ${isOwnMessage ? 'right-2' : 'left-2'} -top-6 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity bg-background/80 rounded-full p-1 shadow-sm z-10`}>
        {onEditMessage && isOwnMessage && (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1 hover:bg-accent rounded-full"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onReactMessage && (
          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(prev => !prev)}
              className="p-1 hover:bg-accent rounded-full"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
            
            {showEmojiPicker && (
              <div className={`absolute z-20 ${isOwnMessage ? 'right-0' : 'left-0'} top-6`}>
                <EmojiPicker 
                  onEmojiSelect={handleReaction}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={`flex max-w-[75%] flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Message sender name - only show in groups if not own message */}
        {isInGroup && !isOwnMessage && (
          <div className="text-xs font-medium ml-2 mb-0.5 text-lime-600 dark:text-lime-400">
            {message.from}
          </div>
        )}
        
        {/* Message bubble */}
        <div 
          className={`rounded-2xl px-3 py-2 break-words ${
            isOwnMessage 
              ? 'bg-lime-500 text-white rounded-br-none' 
              : 'bg-background border border-border rounded-bl-none'
          }`}
        >
          {isEditing ? (
            <form onSubmit={handleSubmitEdit} className="flex">
              <input
                type="text"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="bg-transparent border-b border-white focus:outline-none text-sm px-0 w-full"
                autoFocus
                onBlur={() => setIsEditing(false)}
              />
            </form>
          ) : (
            <>
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              
              {message.image && (
                <img src={message.image} alt="Message attachment" className="max-w-full rounded-md mt-2" />
              )}
              
              {message.edited && (
                <span className="text-xs opacity-70 ml-1">(edited{message.editedBy ? ` by ${message.editedBy}` : ''})</span>
              )}
            </>
          )}
        </div>
        
        {/* Message reactions - show below the message */}
        {reactionsArray.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-2">
            {reactionsArray.filter(r => r.users.length > 0).map(({ emoji, users }) => (
              <TooltipProvider key={emoji}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-background border rounded-full px-1.5 py-0.5 text-sm flex items-center gap-1 hover:bg-accent cursor-default">
                      <span>{emoji}</span>
                      <span className="text-xs">{users.length}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{users.map(u => u.name).join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
        
        {/* Message timestamp */}
        <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 px-2 transition-opacity">
          {formattedDate} {isOwnMessage && <CheckCheck className="inline h-3 w-3 ml-1" />}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
