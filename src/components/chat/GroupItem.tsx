
import React, { useState } from 'react';
import { ChatGroup } from '@/state/store';
import { MoreHorizontal, TrashIcon, Pencil, LogOut, UserPlus, Users } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <li
      className={`relative p-2 rounded-md flex items-start gap-2 transition-colors ${
        isActive
          ? "bg-lime-600/20"
          : "hover:bg-lime-600/10"
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
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
        
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Users className="h-3 w-3" /> {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
        </div>
      </div>
      
      {/* Join button that appears on hover for non-members */}
      {!isMember && isHovering && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJoin();
          }}
          className="absolute right-2 top-2 px-2 py-1 rounded-md bg-lime-600 text-white text-xs hover:bg-lime-700 transition-colors"
        >
          Join
        </button>
      )}
      
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
                <DialogTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMembersDialog(true);
                    }}
                    className="h-7 w-7 rounded-md hover:bg-background flex items-center justify-center focus:outline-none"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Members of {group.name}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[300px] mt-2">
                    <ul className="space-y-2">
                      {group.members.map((member, i) => (
                        <li key={i} className="flex items-center gap-2 p-2 rounded hover:bg-accent">
                          <div className="h-8 w-8 rounded-full bg-lime-200 flex items-center justify-center">
                            {member.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{member}</div>
                            {group.creator === member && (
                              <div className="text-xs text-muted-foreground">Creator</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </TooltipTrigger>
            <TooltipContent>
              <p>View members</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
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
      </div>
    </li>
  );
};

export default GroupItem;
