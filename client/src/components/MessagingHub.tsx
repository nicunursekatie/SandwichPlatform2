import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Users, Send, Plus, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: number;
  type: 'direct' | 'group' | 'channel';
  name: string | null;
  participants: Array<{
    userId: string;
    joinedAt: string;
    lastReadAt: string;
  }>;
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface Message {
  id: number;
  conversationId: number;
  userId: string;
  content: string;
  sender: string;
  createdAt: string;
  updatedAt: string;
}

export default function MessagingHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Fetch messages for selected conversation using new unified API with pagination
  const { data: messageData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', selectedConversation, 'messages'],
    queryFn: selectedConversation 
      ? () => apiRequest('GET', `/api/conversations/${selectedConversation}/messages?limit=50&offset=0`)
      : () => Promise.resolve({ messages: [] }),
    enabled: !!selectedConversation,
  });

  // Safely extract messages array with proper error handling
  const messages = (() => {
    if (!messageData) return [];
    if (Array.isArray(messageData?.messages)) return messageData.messages;
    if (Array.isArray(messageData)) return messageData;
    return [];
  })();

  // Send message mutation using new unified API
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: number; content: string }) => {
      return apiRequest('POST', `/api/conversations/${data.conversationId}/messages`, {
        content: data.content,
        sender: user?.firstName || user?.email || 'Anonymous'
      });
    },
    onSuccess: () => {
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageContent.trim()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.userId !== user?.id);
      return otherParticipant?.userId || 'Direct Message';
    }
    return conversation.name || `${conversation.type} Chat`;
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please log in to access messaging.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-muted/30 border-r transition-all duration-200`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h3 className="font-semibold text-lg">Conversations</h3>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <MessageSquare className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="p-4">
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {sidebarCollapsed ? (
                    <MessageSquare className="h-6 w-6 mx-auto" />
                  ) : (
                    "No conversations yet"
                  )}
                </div>
              ) : (
                conversations.map((conversation: Conversation) => (
                  <Button
                    key={conversation.id}
                    variant={selectedConversation === conversation.id ? "secondary" : "ghost"}
                    className="w-full p-3 h-auto justify-start mb-1"
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {conversation.type === 'group' ? <Users className="h-4 w-4" /> : 
                           getConversationDisplayName(conversation).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {getConversationDisplayName(conversation)}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {conversations.find((c: Conversation) => c.id === selectedConversation)?.name || 
                     getConversationDisplayName(conversations.find((c: Conversation) => c.id === selectedConversation)!)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {conversations.find((c: Conversation) => c.id === selectedConversation)?.participants.length} participants
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse w-24" />
                        <div className="h-8 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    Array.isArray(messages) && messages.map((message: Message) => (
                      <div key={message.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {message.sender?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{message.sender}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    )) || null
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-h-[44px] max-h-32 resize-none"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}