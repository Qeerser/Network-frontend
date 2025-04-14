
import React, { useState } from 'react';
import { Client, Chat } from '@/state/store';
import UserItem from './UserItem';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface UsersListProps {
  onlineUsers: Client[];
  offlineUsers: Client[];
  activeChat: Chat;
  onUserSelect: (user: Client) => void;
}

const MAX_DISPLAY_USERS = 5; // Maximum number of users to display before collapsing

const UsersList: React.FC<UsersListProps> = ({ 
  onlineUsers, 
  offlineUsers, 
  activeChat, 
  onUserSelect 
}) => {
  const [showAllOnline, setShowAllOnline] = useState(false);
  const [showAllOffline, setShowAllOffline] = useState(false);
  
  const displayedOnlineUsers = showAllOnline ? onlineUsers : onlineUsers.slice(0, MAX_DISPLAY_USERS);
  const displayedOfflineUsers = showAllOffline ? offlineUsers : offlineUsers.slice(0, MAX_DISPLAY_USERS);
  
  const hasMoreOnline = onlineUsers.length > MAX_DISPLAY_USERS;
  const hasMoreOffline = offlineUsers.length > MAX_DISPLAY_USERS;
  
  return (
    <div className="space-y-4">
      {/* Online users */}
      <div>
        <h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">
          Online ({onlineUsers.length})
        </h4>
        <ul className="space-y-1">
          {displayedOnlineUsers.length > 0 ? (
            displayedOnlineUsers.map((client) => (
              <UserItem
                key={client.id}
                client={client}
                isActive={activeChat.id === client.id && activeChat.type === "private"}
                isOnline={true}
                onClick={() => onUserSelect(client)}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No other users online</p>
          )}
        </ul>
        
        {hasMoreOnline && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-1 text-xs h-7"
            onClick={() => setShowAllOnline(!showAllOnline)}
          >
            {showAllOnline ? (
              <>
                <ChevronDown className="h-3 w-3 mr-1" /> Show less
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3 mr-1" /> Show {onlineUsers.length - MAX_DISPLAY_USERS} more
              </>
            )}
          </Button>
        )}
      </div>

      {/* Offline users */}
      {offlineUsers.length > 0 && (
        <div>
          <h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">
            Offline ({offlineUsers.length})
          </h4>
          <ul className="space-y-1">
            {displayedOfflineUsers.map((client) => (
              <UserItem
                key={client.id}
                client={client}
                isActive={activeChat.id === client.id && activeChat.type === "private"}
                isOnline={false}
                onClick={() => onUserSelect(client)}
              />
            ))}
          </ul>
          
          {hasMoreOffline && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-1 text-xs h-7"
              onClick={() => setShowAllOffline(!showAllOffline)}
            >
              {showAllOffline ? (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" /> Show less
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3 mr-1" /> Show {offlineUsers.length - MAX_DISPLAY_USERS} more
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UsersList;
