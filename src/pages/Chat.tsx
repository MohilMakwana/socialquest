import { useState, useEffect, useRef, useMemo } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useRealtimeCollection } from '@/hooks/useFirestore';
import { ChatMessage, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { where, or, QueryConstraint } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const Chat: React.FC = () => {
  const { currentUser } = useAuth();
  const { sendMessage } = useFirestore();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getValidDate = (dateValue: any) => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }
    return new Date(dateValue);
  };

  const { data: allUsers } = useRealtimeCollection<User>('users', []);
  const users = useMemo(() => {
    return allUsers.filter(user => user.uid !== currentUser?.uid);
  }, [allUsers, currentUser?.uid]);

  // Strip orderBy to prevent Firebase Index crash. Sort strictly in memory.
  const messageQuery = useMemo(() => {
    if (!selectedUserId || !currentUser?.uid) return [];

    return [
      or(
        where('senderId', '==', currentUser.uid),
        where('receiverId', '==', currentUser.uid)
      )
    ] as unknown as QueryConstraint[];
  }, [selectedUserId, currentUser?.uid]);

  const { data: messages } = useRealtimeCollection<ChatMessage>('messages', messageQuery);

  const conversationMessages = useMemo(() => {
    const filtered = messages.filter(msg =>
      (msg.senderId === currentUser?.uid && msg.receiverId === selectedUserId) ||
      (msg.senderId === selectedUserId && msg.receiverId === currentUser?.uid)
    );
    // Sort manually to bypass Index requirements!
    return filtered.sort((a, b) => getValidDate(a.createdAt).getTime() - getValidDate(b.createdAt).getTime());
  }, [messages, currentUser, selectedUserId]);

  const selectedUser = users.find(user => user.uid === selectedUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedUserId || !message.trim()) return;

    try {
      await sendMessage({
        senderId: currentUser.uid,
        receiverId: selectedUserId,
        content: message.trim(),
        read: false,
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] flex bg-white dark:bg-gray-900 rounded-xl shadow-md border dark:border-gray-800 overflow-hidden">
      {/* Users List */}
      <div className="w-1/3 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 sticky top-0 bg-inherit z-10">
          <h3 className="font-bold text-gray-900 dark:text-white">Chats</h3>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {users.length > 0 ? (
            users.map((user) => (
              <div
                key={user.uid}
                onClick={() => setSelectedUserId(user.uid)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b dark:border-gray-700
                  ${selectedUserId === user.uid
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL || ''} />
                  <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-sm flex-1 overflow-hidden">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.title || 'User'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No users available
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-900 z-10 sticky top-0">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.photoURL || ''} alt={selectedUser.displayName} />
                  <AvatarFallback>
                    {selectedUser.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
                    {selectedUser.displayName}
                  </h3>
                  <p className="text-xs font-medium text-green-500">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {conversationMessages.length > 0 ? (
                conversationMessages.map((msg) => {
                  const isFromCurrentUser = msg.senderId === currentUser?.uid;
                  const createdAt = getValidDate(msg.createdAt);

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end space-x-2 ${isFromCurrentUser ? 'justify-end' : ''}`}
                    >
                      {!isFromCurrentUser && (
                        <Avatar className="h-8 w-8 mb-1">
                          <AvatarImage src={selectedUser.photoURL || ''} alt={selectedUser.displayName} />
                          <AvatarFallback>
                            {selectedUser.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-md rounded-2xl p-4 shadow-sm ${isFromCurrentUser
                            ? 'bg-primary text-white rounded-br-none'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                          }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-2 font-medium ${isFromCurrentUser ? 'text-primary-foreground/70 text-right' : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                          {formatDistanceToNow(createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                  <p className="bg-gray-50 dark:bg-gray-800 px-6 py-3 rounded-full text-sm">Start a conversation with {selectedUser.displayName}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 py-6 rounded-full px-6 bg-gray-50 dark:bg-gray-800 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button type="submit" size="icon" className="h-12 w-12 rounded-full" disabled={!message.trim()}>
                  <Send className="h-5 w-5 ml-1" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Send className="h-10 w-10 text-gray-400 dark:text-gray-500 ml-2" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Messages</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">Select a colleague from the sidebar to chat, share knowledge, and collaborate in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
