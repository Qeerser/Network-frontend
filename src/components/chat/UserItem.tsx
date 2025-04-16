
import React from 'react';
import { Client } from '@/state/store';
import { Flag } from 'lucide-react';

interface UserItemProps {
  client: Client;
  isActive: boolean;
  isOnline: boolean;
  onClick: () => void;
  isCurrentUser?: boolean;
}

const UserItem: React.FC<UserItemProps> = ({ client, isActive, isOnline, onClick, isCurrentUser }) => {
  return (
    <li
      onClick={() => {if (!isCurrentUser) {onClick()}; }  }
      className={`p-2 rounded-md  flex items-center gap-2 transition-colors ${
        isActive
          ? "bg-lime-600/20"
          : "hover:bg-lime-600/10"
      } ${!isOnline && "opacity-60"} 
      ${isCurrentUser ? "hover:bg-white" : "cursor-pointer"}  
      `}
    >
      <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
      <div className="flex items-center">
        <span>{client.name}</span>
        {isCurrentUser && (
          <span className="ml-1 flex items-center text-xs text-muted-foreground">
            [You]
          </span>
        )}
      </div>
    </li>
  );
};

export default UserItem;
