import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealtimeCollection, useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { orderBy, limit, where } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const RightSidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const { followUser, unfollowUser } = useFirestore();

  // Safe date conversion for Firebase Timestamp
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
  
  // Get trending topics (questions grouped by topics)
  const { data: questions, loading: loadingQuestions } = useRealtimeCollection('questions', [
    orderBy('createdAt', 'desc'),
    limit(50)
  ]);

  // Get suggested users to follow
  const { data: users, loading: loadingUsers } = useRealtimeCollection<User>('users', [
    where('uid', '!=', currentUser?.uid || ''),
    limit(10)
  ]);

  const [trendingTopics, setTrendingTopics] = useState<Array<{topic: string, count: number}>>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  useEffect(() => {
    if (questions.length > 0) {
      const topicCounts: Record<string, number> = {};
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Filter questions from last 7 days
      const recentQuestions = questions.filter(question => {
        const questionDate = getValidDate(question.createdAt);
        return questionDate >= sevenDaysAgo;
      });

      recentQuestions.forEach(question => {
        if (question.topics) {
          question.topics.forEach((topic: string) => {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          });
        }
      });

      const sortedTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTrendingTopics(sortedTopics);
    }
  }, [questions]);

  useEffect(() => {
    if (users.length > 0) {
      // Filter out users already followed
      const filteredUsers = users.filter(user => 
        !user.followers.includes(currentUser?.uid || '')
      ).slice(0, 5);
      setSuggestedUsers(filteredUsers);
    }
  }, [users, currentUser?.uid]);

  const handleFollowUser = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      await followUser(currentUser.uid, userId);
      // Update local state
      setSuggestedUsers(prev => 
        prev.filter(user => user.uid !== userId)
      );
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trending Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingQuestions ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-[70%]" />
                  <Skeleton className="h-3 w-[40%]" />
                </div>
              ))
            ) : trendingTopics.length > 0 ? (
              trendingTopics.map(({ topic, count }) => (
                <div key={topic} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{topic}</span>
                  <Badge variant="secondary" className="text-xs">
                    {count} question{count !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No trending topics yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* People to Follow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">People to Follow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {loadingUsers ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-3 w-[80px]" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              ))
            ) : suggestedUsers.length > 0 ? (
              suggestedUsers.map((user) => (
                <div key={user.uid} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                      <AvatarFallback>
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {user.displayName}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.title || 'User'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleFollowUser(user.uid)}
                    className="px-3 py-1 text-sm"
                  >
                    Follow
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No suggestions available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingQuestions ? (
              Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                 </div>
              ))
            ) : questions.slice(0, 3).map((question) => {
              const createdAt = getValidDate(question.createdAt);
              
              return (
                <div key={question.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={question.author.photoURL || ''} alt={question.author.displayName} />
                    <AvatarFallback className="text-xs">
                      {question.author.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {question.author.displayName} asked: {question.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDistanceToNow(createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            {questions.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No recent activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RightSidebar;
