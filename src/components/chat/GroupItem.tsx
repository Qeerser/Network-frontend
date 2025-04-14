
import React from 'react';
import { ChatGroup } from '@/state/store';
import { Button } from '@/components/ui/button';
import { Users, LogOut, UserPlus, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
      onClick={onSelect}
      className={`p-2 rounded-md cursor-pointer transition-colors ${
        isActive ? "bg-lime-600/20" : "hover:bg-lime-600/10"
      }`}
    >
      <div className="flex justify-between items-center">
        <span>{group.name}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <span className="sr-only">Open menu</span>
              <Users size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isMember && !isCreator && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onLeave();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Group
              </DropdownMenuItem>
            )}
            
            {!isMember && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin();
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Join Group
              </DropdownMenuItem>
            )}

            {isCreator && (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename();
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Rename Group
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Last message preview */}
      {group.lastMessage && (
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {group.lastMessage.content}
        </p>
      )}

      <div className="text-xs text-muted-foreground mt-1">
        {group.members.length} members
      </div>
    </li>
  );
};

export default GroupItem;
