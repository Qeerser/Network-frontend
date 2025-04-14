
import React from 'react';
import { Client } from '@/state/store';

interface UserItemProps {
  client: Client;
  isActive: boolean;
  isOnline: boolean;
  onClick: () => void;
}

const UserItem: React.FC<UserItemProps> = ({ client, isActive, isOnline, onClick }) => {
  return (
    <li
      onClick={onClick}
      className={`p-2 rounded-md cursor-pointer flex items-center gap-2 transition-colors ${
        isActive
          ? "bg-lime-600/20"
          : "hover:bg-lime-600/10"
      } ${!isOnline && "opacity-60"}`}
    >
      <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
      <span>{client.name}</span>
    </li>
  );
};

export default UserItem;
