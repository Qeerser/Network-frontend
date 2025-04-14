
import React from 'react';
import { Chat, ChatGroup } from '@/state/store';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, LogOut } from 'lucide-react';

interface ChatHeaderProps {
  activeChat: Chat;
  chatType: "private" | "group";
  groupMembers?: string[];
  isCreator: boolean;
  onRenameGroup: () => void;
  onDeleteGroup: () => void;
  onLeaveGroup: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeChat,
  chatType,
  groupMembers = [],
  isCreator,
  onRenameGroup,
  onDeleteGroup,
  onLeaveGroup
}) => {
  if (!activeChat.id) return null;
  
  return (
    <div className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">
            {chatType === "private" ? `Chat with ${activeChat.name}` : activeChat.name}
          </h3>
          {chatType === "group" && groupMembers.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {groupMembers.join(", ")}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {chatType === "group" && (
          <div className="flex gap-2">
            {isCreator ? (
              <>
                {/* Rename group button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRenameGroup}
                  className="h-8 hover:bg-lime-600/10 hover:text-lime-600 transition-colors"
                >
                  <Edit size={14} className="mr-1" /> Rename
                </Button>

                {/* Delete group button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDeleteGroup}
                  className="h-8"
                >
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </>
            ) : (
              /* Leave group button (only for non-creators) */
              <Button
                variant="outline"
                size="sm"
                onClick={onLeaveGroup}
                className="h-8 hover:bg-lime-600/10 hover:text-lime-600 transition-colors"
              >
                <LogOut size={14} className="mr-1" /> Leave
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
