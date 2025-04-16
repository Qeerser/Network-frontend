
import React, { useState, useMemo } from 'react';
import { Client, Chat } from '@/state/store';
import UserItem from './UserItem';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface UsersListProps {
  onlineUsers: Client[];
  offlineUsers: Client[];
  activeChat: Chat;
  onUserSelect: (user: Client) => void;
  currentUserId: string;
}

const MAX_DISPLAY_USERS = 5; // Maximum number of users to display before collapsing

const UsersList: React.FC<UsersListProps> = ({ 
  onlineUsers, 
  offlineUsers, 
  activeChat, 
  onUserSelect,
  currentUserId
}) => {
  const [showAllOnline, setShowAllOnline] = useState(false);
  const [showAllOffline, setShowAllOffline] = useState(false);
  
  // Reorganize online users to put current user at the top
  const sortedOnlineUsers = useMemo(() => {
    // Find the current user
    const currentUserIndex = onlineUsers.findIndex(user => user.id === currentUserId);
    
    if (currentUserIndex === -1) return onlineUsers;
    
    // Create a new array with current user at the top
    const result = [...onlineUsers];
    const currentUser = result.splice(currentUserIndex, 1)[0];
    return [currentUser, ...result];
  }, [onlineUsers, currentUserId]);
  
  const displayedOnlineUsers = showAllOnline ? sortedOnlineUsers : sortedOnlineUsers.slice(0, MAX_DISPLAY_USERS);
  const displayedOfflineUsers = showAllOffline ? offlineUsers : offlineUsers.slice(0, MAX_DISPLAY_USERS);
  
  const hasMoreOnline = sortedOnlineUsers.length > MAX_DISPLAY_USERS;
  const hasMoreOffline = offlineUsers.length > MAX_DISPLAY_USERS;
  
  const handleUserClick = (user: Client) => {
    // If already active, clear the selection; otherwise select the user
    if (activeChat.id === user.id && activeChat.type === "private") {
      // Clear active chat by passing an empty client
      onUserSelect({ id: "", name: "" });
    } else {
      onUserSelect(user);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Online users */}
      <div>
        <h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">
          Online ({sortedOnlineUsers.length})
        </h4>
        <ul className="space-y-1">
          {displayedOnlineUsers.length > 0 ? (
            displayedOnlineUsers.map((client) => (
              <UserItem
                key={client.id}
                client={client}
                isActive={activeChat.id === client.id && activeChat.type === "private"}
                isOnline={true}
                onClick={() => handleUserClick(client)}
                isCurrentUser={client.id === currentUserId}
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
                <ChevronRight className="h-3 w-3 mr-1" /> Show {sortedOnlineUsers.length - MAX_DISPLAY_USERS} more
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
                isCurrentUser={client.id === currentUserId}
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
