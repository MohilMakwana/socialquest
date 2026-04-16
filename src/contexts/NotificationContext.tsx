import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useRealtimeCollection } from '@/hooks/useFirestore';
import { ChatMessage, Question, User } from '@/types';
import { where, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface NotificationContextType {
  unreadMessagesCount: number;
  newFollowerPosts: Question[];
  markMessagesAsRead: (userId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notifiedMessages, setNotifiedMessages] = useState<Set<string>>(new Set());
  const [notifiedPosts, setNotifiedPosts] = useState<Set<string>>(new Set());

  // Get unread messages
  const { data: messages } = useRealtimeCollection<ChatMessage>('messages', 
    currentUser ? [
      where('receiverId', '==', currentUser.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    ] : []
  );

  // Get posts from followed users
  const { data: allQuestions } = useRealtimeCollection<Question>('questions', [
    orderBy('createdAt', 'desc')
  ]);

  const newFollowerPosts = allQuestions.filter(question => 
    userProfile?.following.includes(question.authorId) && 
    question.authorId !== currentUser?.uid
  );

  // Update unread count
  useEffect(() => {
    setUnreadMessagesCount(messages.length);
  }, [messages]);

  // Show notification for new messages
  useEffect(() => {
    messages.forEach(message => {
      if (!notifiedMessages.has(message.id)) {
        toast({
          title: "New message",
          description: `${message.senderId}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
        });
        setNotifiedMessages(prev => new Set(prev).add(message.id));
      }
    });
  }, [messages, notifiedMessages, toast]);

  // Show notification for new posts from followed users
  useEffect(() => {
    newFollowerPosts.forEach(post => {
      if (!notifiedPosts.has(post.id)) {
        toast({
          title: "New post from someone you follow",
          description: `${post.author.displayName} asked: ${post.title}`,
        });
        setNotifiedPosts(prev => new Set(prev).add(post.id));
      }
    });
  }, [newFollowerPosts, notifiedPosts, toast]);

  const markMessagesAsRead = (userId: string) => {
    // This would typically update the messages in Firebase
    // For now, we'll just update the local state
    setUnreadMessagesCount(0);
  };

  return (
    <NotificationContext.Provider value={{
      unreadMessagesCount,
      newFollowerPosts,
      markMessagesAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};