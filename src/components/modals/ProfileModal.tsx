import { useState, useEffect } from 'react';
import { X, UserPlus, MessageCircle, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useRealtimeCollection } from '@/hooks/useFirestore';
import { User, Question, UserStats } from '@/types';
import { where, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'wouter';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userId }) => {
  const { currentUser, userProfile } = useAuth();
  const { followUser, unfollowUser, getUserStats } = useFirestore();
  const [stats, setStats] = useState<UserStats>({ questionsCount: 0, answersCount: 0, likesReceived: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [_, setLocation] = useLocation();

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

  // Get user profile
  const { data: users } = useRealtimeCollection<User>('users', [
    where('uid', '==', userId)
  ]);
  const user = users[0];

  // Get user's questions
  const { data: userQuestions } = useRealtimeCollection<Question>('questions', [
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(10)
  ]);

  useEffect(() => {
    if (user && userProfile) {
      setIsFollowing(user.followers.includes(userProfile.uid));
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (userId) {
      getUserStats(userId).then(setStats).catch(console.error);
    }
  }, [userId, getUserStats]);

  const handleFollow = async () => {
    if (!currentUser || !user) return;
    
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.uid, user.uid);
      } else {
        await followUser(currentUser.uid, user.uid);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleMessage = () => {
    setLocation('/chat');
    onClose();
  };

  if (!isOpen || !user) return null;

  // Check if profile is private and user is not following
  const isPrivateAndNotFollowing = user.isPrivate && !isFollowing && user.uid !== currentUser?.uid;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                  <AvatarFallback className="text-xl">
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.displayName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.title || 'User'}
                  </p>
                  {user.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {user.location}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user.followers.length} followers
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user.following.length} following
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {user.uid !== currentUser?.uid && (
                  <>
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button variant="outline" onClick={handleMessage}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Profile Bio */}
            {user.bio && (
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  {user.bio}
                </p>
              </div>
            )}

            {isPrivateAndNotFollowing ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-medium mb-2">This account is private</p>
                  <p>Follow {user.displayName} to see their posts</p>
                </div>
              </div>
            ) : (
              <>
                {/* Profile Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats.questionsCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Questions
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats.answersCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Answers
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats.likesReceived}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Likes
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userQuestions.length > 0 ? (
                        userQuestions.map((question) => {
                          const createdAt = question.createdAt instanceof Date 
                            ? question.createdAt 
                            : new Date(question.createdAt);

                          return (
                            <div key={question.id} className="border dark:border-gray-700 rounded-lg p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                {question.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                {question.description}
                              </p>
                              
                              {question.topics && question.topics.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {question.topics.map((topic, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center space-x-1">
                                  <Heart className="h-3 w-3" />
                                  <span>{question.likes.length} likes</span>
                                </span>
                                <span>
                                  {formatDistanceToNow(getValidDate(question.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          No posts yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

    </>
  );
};

export default ProfileModal;
