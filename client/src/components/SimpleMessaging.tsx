import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Send, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  sender: string;
  createdAt: string;
  userId: string;
}

const CHAT_CHANNELS = [
  { id: 'general', name: 'General Chat', description: 'Main discussion' },
  { id: 'committee', name: 'Committee Chat', description: 'Committee discussions' },
  { id: 'hosts', name: 'Host Chat', description: 'Host communications' },
  { id: 'drivers', name: 'Driver Chat', description: 'Driver coordination' },
  { id: 'recipients', name: 'Recipient Chat', description: 'Recipient updates' },
  { id: 'core_team', name: 'Core Team', description: 'Core team only' },
];

export function SimpleMessaging() {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();

  // Fetch messages with direct fetch
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['simple-messages', selectedChannel],
    queryFn: async () => {
      const response = await fetch(`/api/messages?chatType=${selectedChannel}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          chatType: selectedChannel,
          sender: user?.firstName || user?.email || 'Anonymous'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['simple-messages', selectedChannel] });
    }
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error(`Failed to edit message: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      setEditingMessage(null);
      setEditContent('');
      queryClient.invalidateQueries({ queryKey: ['simple-messages', selectedChannel] });
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-messages', selectedChannel] });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleEditMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (editContent.trim() && editingMessage && !editMessageMutation.isPending) {
      editMessageMutation.mutate({ id: editingMessage, content: editContent.trim() });
    }
  };

  const startEdit = (message: Message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Please log in to access messages</p>
      </div>
    );
  }

  const currentChannel = CHAT_CHANNELS.find(ch => ch.id === selectedChannel);

  return (
    <div className="flex h-96 border rounded-lg">
      {/* Channel Sidebar */}
      <div className="w-64 border-r bg-muted/5">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Channels</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {CHAT_CHANNELS.map((channel) => (
              <Button
                key={channel.id}
                variant={selectedChannel === channel.id ? "default" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => setSelectedChannel(channel.id)}
              >
                <span className="truncate">{channel.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/10">
          <div>
            <h3 className="font-semibold">{currentChannel?.name}</h3>
            <p className="text-sm text-muted-foreground">
              {messages.length} messages
            </p>
          </div>
        </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: Message) => (
              <div key={message.id} className="flex space-x-3 group">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {(message.sender || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm truncate">
                      {message.sender || 'Anonymous'}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(message.createdAt)}
                    </span>
                    {/* Show edit/delete for own messages */}
                    {message.userId === user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(message)}>
                            <Edit2 className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMessageMutation.mutate(message.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {editingMessage === message.id ? (
                    <form onSubmit={handleEditMessage} className="flex space-x-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button type="submit" size="sm" disabled={!editContent.trim()}>
                        Save
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <p className="text-sm break-words">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${currentChannel?.name}...`}
              disabled={sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}