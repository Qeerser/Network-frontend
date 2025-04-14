
import React from 'react';
import { ChatGroup } from '@/state/store';
import { MoreHorizontal, TrashIcon, Pencil, LogOut, UserPlus } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface GroupItemProps {
  group: ChatGroup;
  isActive: boolean;
  isCreator: boolean;
  isMember: boolean;
  clientName: string;
  clientId: string;
  onSelect: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onRename: () => void;
}

const GroupItem: React.FC<GroupItemProps> = ({
  group,
  isActive,
  isCreator,
  isMember,
  clientName,
  clientId,
  onSelect,
  onJoin,
  onLeave,
  onDelete,
  onRename
}) => {
  return (
    <li
      className={`relative p-2 rounded-md flex items-start gap-2 transition-colors ${
        isActive
          ? "bg-lime-600/20"
          : "hover:bg-lime-600/10"
      }`}
    >
      <div className="flex-grow cursor-pointer" onClick={onSelect}>
        <div className="flex items-center justify-between">
          <span className="font-medium">{group.name}</span>
          {group.lastMessage?.timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(group.lastMessage.timestamp), { addSuffix: true })}
            </span>
          )}
        </div>
        
        {group.lastMessage && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {group.lastMessageSender && <span className="font-medium">{group.lastMessageSender}: </span>}
            {group.lastMessage.content}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-0.5">
          {group.members.length} member{group.members.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="h-7 w-7 rounded-md hover:bg-background flex items-center justify-center focus:outline-none"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {!isMember && (
            <DropdownMenuItem onClick={onJoin} className="cursor-pointer">
              <UserPlus className="h-4 w-4 mr-2" />
              Join Group
            </DropdownMenuItem>
          )}
          
          {isMember && !isCreator && (
            <DropdownMenuItem onClick={onLeave} className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Leave Group
            </DropdownMenuItem>
          )}

          {isCreator && (
            <>
              <DropdownMenuItem onClick={onRename} className="cursor-pointer">
                <Pencil className="h-4 w-4 mr-2" />
                Rename Group
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Group
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
};

export default GroupItem;
