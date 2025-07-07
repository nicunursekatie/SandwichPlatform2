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
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [messageContent, setMessageContent] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch conversations using the working old API
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: () => [
      { id: 1, type: 'channel', name: 'General Chat', participants: [] },
      { id: 2, type: 'channel', name: 'Committee Chat', participants: [] },
      { id: 3, type: 'channel', name: 'Host Chat', participants: [] },
      { id: 4, type: 'channel', name: 'Driver Chat', participants: [] },
      { id: 5, type: 'channel', name: 'Recipient Chat', participants: [] },
      { id: 6, type: 'channel', name: 'Core Team', participants: [] },
      { id: 7, type: 'direct', name: 'Direct Messages', participants: [] },
      { id: 8, type: 'group', name: 'Group Messages', participants: [] },
    ],
    enabled: !!user,
  });

  // Auto-select General Chat when conversations load
  useEffect(() => {
    if (conversations.length > 0 && selectedConversation !== 1) {
      setSelectedConversation(1); // Force General Chat (ID: 1)
    }
  }, [conversations]);

  // Fetch messages for selected conversation using working old API
  const { data: messageData, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages', selectedConversation || 1, Date.now()], // Force unique key
    queryFn: async () => {
      console.log('[DEBUG] Query executing for user:', user?.id);
      // Always default to general chat with cache buster
      const result = await apiRequest('GET', `/api/messages?chatType=general&t=${Date.now()}`);
      console.log('[DEBUG] Query result:', result);
      return result;
    },
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 0,
    cacheTime: 0, // Disable caching completely
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Safely extract messages array with proper error handling
  const messages = (() => {
    console.log('[DEBUG] messageData received:', messageData);
    if (!messageData) {
      console.log('[DEBUG] No messageData, returning empty array');
      return [];
    }
    if (Array.isArray(messageData?.messages)) {
      console.log('[DEBUG] Found messages in messageData.messages:', messageData.messages.length);
      return messageData.messages;
    }
    if (Array.isArray(messageData)) {
      console.log('[DEBUG] messageData is array:', messageData.length);
      return messageData;
    }
    console.log('[DEBUG] messageData type not recognized:', typeof messageData);
    return [];
  })();

  // Send message mutation using working old API
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: number; content: string }) => {
      const convName = conversations.find(c => c.id === data.conversationId)?.name?.toLowerCase();
      const chatType = convName?.includes('general') ? 'general' :
                      convName?.includes('committee') ? 'committee' :
                      convName?.includes('host') ? 'host' :
                      convName?.includes('driver') ? 'driver' :
                      convName?.includes('recipient') ? 'recipient' :
                      convName?.includes('core') ? 'core_team' :
                      convName?.includes('direct') ? 'direct' :
                      convName?.includes('group') ? 'group' : 'general';
      
      return apiRequest('POST', '/api/messages', {
        content: data.content,
        chatType: chatType,
        sender: user?.firstName || user?.email || 'Anonymous'
      });
    },
    onSuccess: (data, variables) => {
      setMessageContent("");
      // Invalidate and refetch messages for this conversation
      queryClient.invalidateQueries({ 
        queryKey: ['/api/messages', variables.conversationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
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

  const getConversationDisplayName = (conversation: Conversation | undefined) => {
    if (!conversation) return 'General Chat';
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
    <div className="flex flex-col lg:flex-row h-[70vh] lg:h-full min-h-[500px] border rounded-lg overflow-hidden relative mobile-full-width">
      {/* Sidebar - Conversations List - Always visible on mobile */}
      <div className={`
        ${sidebarCollapsed ? 'w-16' : 'w-full lg:w-80'} 
        bg-muted/30 border-r lg:border-b-0 border-b transition-all duration-200 
        flex flex-col h-48 lg:h-full overflow-hidden mobile-full-width
      `}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h3 className="font-semibold text-lg">Conversations</h3>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:inline-flex"
              >
                {sidebarCollapsed ? <MessageSquare className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
              </Button>
            </div>
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
      <div className="flex-1 flex flex-col min-w-0 h-full lg:h-auto">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">

                  <div>
                    <h3 className="font-semibold truncate">
                      {conversations.find((c: Conversation) => c.id === selectedConversation)?.name || 
                       getConversationDisplayName(conversations.find((c: Conversation) => c.id === selectedConversation)!)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {conversations.find((c: Conversation) => c.id === selectedConversation)?.participants.length} participants
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-2 lg:p-4 h-64 lg:h-auto">
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
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm truncate">{message.sender}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2 sm:p-3 max-w-full">
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    )) || null
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-2 sm:p-4 border-t">
              <div className="flex space-x-1 sm:space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-h-[40px] sm:min-h-[44px] max-h-32 resize-none text-sm sm:text-base"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="px-2 sm:px-3"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-64 lg:h-auto">
            <div className="text-center text-muted-foreground p-4">
              <MessageSquare className="h-8 w-8 lg:h-12 lg:w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base lg:text-lg font-medium">Select a conversation</p>
              <p className="text-xs lg:text-sm">Choose a conversation above to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}