# WebSocket API Documentation

This document outlines the WebSocket events used for communication between client and server in the real-time messaging system.

## Connection Events

- `connect`: Client connects to the WebSocket server
- `disconnect`: Client disconnects from the WebSocket server
- `updateClient`: Client updates their information (name, id)
  - Payload: `{ name: string, id: string }`

## User Presence Events

- `clients`: Server sends list of connected clients
  - Payload: `Client[]` where Client is `{ id: string, name: string }`
- `offlineClients`: Server sends list of offline clients
  - Payload: `Client[]`
- `userPresenceChanged`: Server notifies when a user's presence changes
  - Payload: `{ userId: string, isOnline: boolean }`

## Message Events

- `privateMessage`: Client sends a private message
  - Payload: `ChatMessage`
- `groupMessage`: Client sends a group message
  - Payload: `ChatMessage`
- `messageReceived`: Server broadcasts a received message
  - Payload: `ChatMessage`
- `editMessage`: Client edits a message
  - Payload: `{ messageId: string, newContent: string }`
- `messageEdited`: Server broadcasts an edited message
  - Payload: `{ messageId: string, newContent: string, editedBy: string }`

## Message Reactions

- `reactToMessage`: Client reacts to a message
  - Payload: `{ messageId: string, reaction: string }`
- `messageReacted`: Server broadcasts a message reaction
  - Payload: 
    ```typescript
    { 
      messageId: string, 
      reaction: string, 
      reactedBy: { 
        id: string, 
        name: string,
        timestamp: number 
      } 
    }
    ```
- `removeReaction`: Client removes a reaction from a message
  - Payload: `{ messageId: string, reaction: string }`
- `reactionRemoved`: Server broadcasts a removed reaction
  - Payload: `{ messageId: string, reaction: string, userId: string }`

## Chat History

- `fetchMessages`: Client requests message history
  - Payload: `{ target: string, type: "private" | "group", limit?: number, before?: number }`
- `messagesFetched`: Server sends requested messages
  - Payload: `{ messages: ChatMessage[], hasMore: boolean }`
- `messageFetchError`: Server reports an error fetching messages
  - Payload: `string` (error message)
- `fetchRecentMessages`: Client requests recent conversations
  - Payload: `{ timestamp?: number, limit?: number }` - Enhanced to include optional timestamp and limit
- `recentMessages`: Server sends recent conversations
  - Payload: `{ chats: Record<string, ChatMessage>, timestamp?: number }` - Enhanced to include the most recent timestamp

## Group Management

- `createGroup`: Client creates a new group
  - Payload: `{ name: string }`
- `joinGroup`: Client joins a group
  - Payload: `{ groupId: string }`
- `leaveGroup`: Client leaves a group
  - Payload: `{ groupId: string }`
- `deleteGroup`: Client deletes a group (if creator)
  - Payload: `{ groupId: string }`
- `renameGroup`: Client renames a group (if creator)
  - Payload: `{ groupId: string, newName: string }`
- `groupRenamed`: Server broadcasts group renamed event
  - Payload: `{ groupId: string, newName: string }`
- `groups`: Server sends list of available groups
  - Payload: `ChatGroup[]`

## User Interaction

- `userTyping`: Client/Server broadcasts typing status
  - Payload: `{ userId: string, chatId: string, isTyping: boolean }`

## Error Handling

- `error`: Server sends an error to the client
  - Payload: `{ message: string, code?: number }`
