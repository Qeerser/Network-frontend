
import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Image, Smile, X } from 'lucide-react';
import EmojiPicker from '@/components/EmojiPicker';
import { useAuthStore } from '@/state/authStore';
import { set } from 'date-fns';

interface MessageInputProps {
  activeChat: {
    id: string;
    name: string;
    type: "private" | "group" | null;
  };
  onSendMessage: (content: string, image?: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ activeChat, onSendMessage }) => {
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage } = useAuthStore();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!messageText.trim() && !imageAttachment) || !activeChat.id) return;

    if (currentFile) {
      const res = await uploadImage(currentFile)
      onSendMessage(messageText, res);
    } else {
      onSendMessage(messageText);
    }
    
    setCurrentFile(null);
    setMessageText("");
    setImageAttachment(null);
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageAttachment(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageAttachment(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  if (!activeChat.id) return null;

  return (
    <div className="p-4 border-t">
      {/* Image preview */}
      {imageAttachment && (
        <div className="mb-2 relative">
          <img
            src={imageAttachment}
            alt="Attachment preview"
            className="h-24 object-contain rounded border shadow-[var(--pixel-shadow)]"
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemoveImage}
            className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
          >
            <X size={12} />
          </Button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="mb-2">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2">
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
          ref={imageInputRef}
        />

        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={`Message ${activeChat.type === "private" ? activeChat.name : "group"}`}
          className="flex-1"
        />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="h-10 w-10 p-0 hover:bg-lime-600/10 transition-colors"
        >
          <Smile size={20} />
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => imageInputRef.current?.click()}
          className="h-10 w-10 p-0 hover:bg-lime-600/10 transition-colors"
        >
          <Image size={20} />
        </Button>

        <Button 
          type="submit" 
          size="sm" 
          disabled={!messageText.trim() && !imageAttachment}
          className="bg-lime-600 hover:bg-lime-700 transition-colors"
        >
          <Send size={16} className="mr-2" /> Send
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
