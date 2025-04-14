
import React from 'react';
import { ChatGroup, Chat } from '@/state/store';
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
  onRenameGroup
}) => {
  return (
    <ul className="space-y-1">
      {groups.length > 0 ? (
        groups.map((group) => (
          <GroupItem
            key={group.id}
            group={group}
            isActive={activeChat.id === group.id && activeChat.type === "group"}
            isCreator={group.creator === clientName || group.creatorId === clientId}
            isMember={group.members.includes(clientName) || group.memberIds.includes(clientId)}
            clientName={clientName}
            clientId={clientId}
            onSelect={() => {
              onGroupSelect({
                id: group.id,
                name: group.name,
                type: "group"
              });
              if (!group.members.includes(clientName)) {
                onJoinGroup({
                  id: group.id,
                  name: group.name,
                  type: "group"
                });
              }
            }}
            onJoin={() => {
              onJoinGroup({
                id: group.id,
                name: group.name,
                type: "group"
              });
            }}
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
        <p className="text-muted-foreground text-sm">No groups available</p>
      )}
    </ul>
  );
};

export default GroupsList;
