import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');

  // Fetch messages directly with chatType=general
  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/messages', 'general'],
    queryFn: () => apiRequest('GET', '/api/messages?chatType=general'),
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log('[DEBUG] Sending message:', content);
      return await apiRequest('POST', '/api/messages', {
        content,
        chatType: 'general',
        sender: user?.firstName || user?.email || 'User'
      });
    },
    onSuccess: () => {
      console.log('[DEBUG] Message sent successfully');
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages', 'general'] });
      refetch();
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>General Chat - Simple Test</CardTitle>
          <p className="text-sm text-gray-600">
            Direct connection to General Chat (conversation_id: 1)
          </p>
        </CardHeader>
        <CardContent>
          {/* Messages Display */}
          <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-white">
            {isLoading ? (
              <div className="text-center text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
            ) : (
              <div className="space-y-3">
                {messages.map((message: any) => (
                  <div key={message.id} className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-blue-600">
                        {message.sender || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>

          {/* Debug Info */}
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <div><strong>Messages Count:</strong> {messages.length}</div>
            <div><strong>User:</strong> {user?.email || 'Not logged in'}</div>
            <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
            <div><strong>Last Update:</strong> {new Date().toLocaleTimeString()}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}