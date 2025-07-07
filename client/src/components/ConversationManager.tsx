import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Users, MessageSquare, X, UserPlus, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface Conversation {
  id: number;
  type: 'direct' | 'group' | 'channel';
  name: string | null;
  participants: Array<{
    userId: string;
    joinedAt: string;
    lastReadAt: string;
  }>;
}

export default function ConversationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationType, setConversationType] = useState<'direct' | 'group' | 'channel'>('direct');
  const [conversationName, setConversationName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  // Fetch available users
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Fetch conversations for management
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      name?: string;
      participants: string[];
    }) => {
      return apiRequest('POST', '/api/conversations', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Conversation created successfully",
      });
      setIsOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  // Add participant mutation
  const addParticipantMutation = useMutation({
    mutationFn: async (data: { conversationId: number; userId: string }) => {
      return apiRequest('POST', `/api/conversations/${data.conversationId}/participants`, {
        userId: data.userId
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Participant added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add participant",
        variant: "destructive",
      });
    },
  });

  // Remove participant mutation
  const removeParticipantMutation = useMutation({
    mutationFn: async (data: { conversationId: number; userId: string }) => {
      return apiRequest('DELETE', `/api/conversations/${data.conversationId}/participants/${data.userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Participant removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove participant",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setConversationType('direct');
    setConversationName("");
    setSelectedUsers([]);
  };

  const handleCreateConversation = () => {
    if (conversationType !== 'direct' && !conversationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a conversation name",
        variant: "destructive",
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one participant",
        variant: "destructive",
      });
      return;
    }

    // Add current user to participants
    const participants = [...selectedUsers, user?.id].filter(Boolean) as string[];

    createConversationMutation.mutate({
      type: conversationType,
      name: conversationType === 'direct' ? undefined : conversationName.trim(),
      participants: participants,
    });
  };

  const getUserDisplayName = (userId: string) => {
    const foundUser = users.find((u: User) => u.id === userId);
    if (foundUser) {
      return foundUser.firstName && foundUser.lastName 
        ? `${foundUser.firstName} ${foundUser.lastName}`
        : foundUser.email;
    }
    return userId;
  };

  const getAvailableUsers = () => {
    return users.filter((u: User) => u.id !== user?.id);
  };

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.userId !== user?.id);
      return getUserDisplayName(otherParticipant?.userId || '');
    }
    return conversation.name || `${conversation.type} Chat`;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Create New Conversation */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Conversation Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={conversationType} onValueChange={(value) => setConversationType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Direct Message
                    </div>
                  </SelectItem>
                  <SelectItem value="group">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Group Chat
                    </div>
                  </SelectItem>
                  <SelectItem value="channel">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Channel
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conversation Name (for groups and channels) */}
            {conversationType !== 'direct' && (
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Enter conversation name"
                  value={conversationName}
                  onChange={(e) => setConversationName(e.target.value)}
                />
              </div>
            )}

            {/* Participant Selection */}
            <div className="space-y-2">
              <Label>Participants</Label>
              <Select 
                value="" 
                onValueChange={(userId) => {
                  if (userId && !selectedUsers.includes(userId)) {
                    setSelectedUsers([...selectedUsers, userId]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add participants" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUsers()
                    .filter((u: User) => !selectedUsers.includes(u.id))
                    .map((u: User) => (
                    <SelectItem key={u.id} value={u.id}>
                      {getUserDisplayName(u.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected Participants */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUsers.map((userId) => (
                    <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                      {getUserDisplayName(userId)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Create Button */}
            <Button 
              onClick={handleCreateConversation}
              disabled={createConversationMutation.isPending}
              className="w-full"
            >
              {createConversationMutation.isPending ? "Creating..." : "Create Conversation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing Conversations Management */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Manage Conversations</h3>
        
        <ScrollArea className="h-96 border rounded-lg p-4">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No conversations yet. Create one above!
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation: Conversation) => (
                <div key={conversation.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{getConversationDisplayName(conversation)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {conversation.type} • {conversation.participants.length} participants
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  {/* Participants */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Participants</Label>
                    <div className="flex flex-wrap gap-2">
                      {conversation.participants.map((participant) => (
                        <Badge key={participant.userId} variant="outline" className="flex items-center gap-1">
                          {getUserDisplayName(participant.userId)}
                          {participant.userId !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeParticipantMutation.mutate({
                                conversationId: conversation.id,
                                userId: participant.userId
                              })}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                      
                      {/* Add Participant Button */}
                      <Select 
                        value="" 
                        onValueChange={(userId) => {
                          if (userId) {
                            addParticipantMutation.mutate({
                              conversationId: conversation.id,
                              userId: userId
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-auto h-6 text-xs">
                          <UserPlus className="h-3 w-3" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableUsers()
                            .filter((u: User) => !conversation.participants.some(p => p.userId === u.id))
                            .map((u: User) => (
                            <SelectItem key={u.id} value={u.id}>
                              {getUserDisplayName(u.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}