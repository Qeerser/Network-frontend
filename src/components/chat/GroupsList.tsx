
import React from 'react';
import { ChatGroup, Chat, Client } from '@/state/store';
import GroupItem from './GroupItem';

interface GroupsListProps {
  groups: ChatGroup[];
  activeChat: Chat;
  clientName: string;
  clientId: string;
  onGroupSelect: (group: Chat) => void;
  onJoinGroup: (group: Chat) => void;
  onLeaveGroup: (group: Chat) => void;
  onDeleteGroup: (group: Chat) => void;
  onRenameGroup: (group: Chat) => void;
  showJoinOnHover?: boolean;
  onClickGroupMember: (member: Client) => void;
}

const GroupsList: React.FC<GroupsListProps> = ({ 
  groups, 
  activeChat, 
  clientName,
  clientId,
  onGroupSelect,
  onJoinGroup,
  onLeaveGroup,
  onDeleteGroup,
  onRenameGroup,
  showJoinOnHover,
  onClickGroupMember
}) => {
  // Split groups into joined and available
  const joinedGroups = groups.filter(group => 
    group.members.includes(clientName) || group.memberIds.includes(clientId)
  );
  
  const availableGroups = groups.filter(group => 
    !group.members.includes(clientName) && !group.memberIds.includes(clientId)
  );

  return (
    <div className="space-y-4">
      {/* Joined Groups */}
      <div>
        <h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">
          Your Groups ({joinedGroups.length})
        </h4>
        <ul className="space-y-1">
          {joinedGroups.length > 0 ? (
            joinedGroups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                isActive={activeChat.id === group.id && activeChat.type === "group"}
                isCreator={group.creator === clientName || group.creatorId === clientId}
                onClickGroupMember={onClickGroupMember}
                isMember={true}
                clientName={clientName}
                clientId={clientId}
                onSelect={() => {
                  onGroupSelect({
                    id: group.id,
                    name: group.name,
                    type: "group"
                  });
                }}
                onJoin={() => {}}
                onLeave={() => {
                  onLeaveGroup({
                    id: group.id,
                    name: group.name,
                    type: "group"
                  });
                }}
                onDelete={() => {
                  onDeleteGroup({
                    id: group.id,
                    name: group.name,
                    type: "group"
                  });
                }}
                onRename={() => {
                  onRenameGroup({
                    id: group.id,
                    name: group.name,
                    type: "group"
                  });
                }}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">You haven't joined any groups yet</p>
          )}
        </ul>
      </div>

      {/* Available Groups */}
      {availableGroups.length > 0 && (
        <div>
          <h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">
            Available Groups ({availableGroups.length})
          </h4>
          <ul className="space-y-1">
            {availableGroups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                isActive={activeChat.id === group.id && activeChat.type === "group"}
                isCreator={false}
                isMember={false}
                clientName={clientName}
                onClickGroupMember={onClickGroupMember}
                clientId={clientId}
                onSelect={() => {
                  onGroupSelect({
                    id: group.id,
                    name: group.name,
                    type: "group"
                  });
                  onJoinGroup({
                    id: group.id,
                    name: group.name,
                    type: "group"
                  });
                }}
                onJoin={() => {
                  onJoinGroup({
                    id: group.id,
                    name: group.name,
                    type: "group"
                  });
                }}
                onLeave={() => {}}
                onDelete={() => {}}
                onRename={() => {}}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GroupsList;
