import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useRealtimeCollection } from '@/hooks/useFirestore';
import { Question, User, UserStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, MapPin, Briefcase, Calendar, Heart, MessageCircle, Edit2 } from 'lucide-react';
import { where } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import QuestionCard from '@/components/QuestionCard';
import { Skeleton } from '@/components/ui/skeleton';

const Profile: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { getUserStats } = useFirestore();
  const [stats, setStats] = useState<UserStats>({ questionsCount: 0, answersCount: 0, likesReceived: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: userProfile?.bio || '',
    title: userProfile?.title || '',
    location: userProfile?.location || '',
    isPrivate: userProfile?.isPrivate || false,
  });

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

  // Get user's questions
  const { data: rawMyQuestions, loading: loadingQuestions } = useRealtimeCollection<Question>('questions', 
    currentUser ? [
      where('authorId', '==', currentUser.uid)
    ] : []
  );
  
  // Sort mechanically to dodge Firebase Index composite limits
  const myQuestions = rawMyQuestions.sort((a, b) => getValidDate(b.createdAt).getTime() - getValidDate(a.createdAt).getTime());

  // Get user's followers and following
  const { data: followers, loading: loadingFollowers } = useRealtimeCollection<User>('users', 
    userProfile ? [
      where('following', 'array-contains', userProfile.uid)
    ] : []
  );

  const { data: following, loading: loadingFollowing } = useRealtimeCollection<User>('users', 
    userProfile ? [
      where('uid', 'in', userProfile.following.length > 0 ? userProfile.following : [''])
    ] : []
  );

  useEffect(() => {
    if (currentUser) {
      getUserStats(currentUser.uid).then(setStats).catch(console.error);
    }
  }, [currentUser, getUserStats]);

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        bio: userProfile.bio || '',
        title: userProfile.title || '',
        location: userProfile.location || '',
        isPrivate: userProfile.isPrivate || false,
      });
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!currentUser || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Please login to view your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.photoURL || ''} alt={userProfile.displayName} />
                <AvatarFallback className="text-2xl">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userProfile.displayName}
                </h1>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      placeholder="Job Title"
                      className="px-3 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      placeholder="Location"
                      className="px-3 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      placeholder="Bio"
                      className="px-3 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 w-full"
                      rows={3}
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.isPrivate}
                        onChange={(e) => setEditForm({...editForm, isPrivate: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Private Account</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {userProfile.title && (
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Briefcase className="h-4 w-4" />
                        <span>{userProfile.title}</span>
                      </div>
                    )}
                    {userProfile.location && (
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>{userProfile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDistanceToNow(getValidDate(userProfile.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                )}
                {userProfile.bio && !isEditing && (
                  <p className="text-gray-700 dark:text-gray-300 mt-2">{userProfile.bio}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveProfile} className="px-4 py-2">
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="px-4 py-2">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="px-4 py-2">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.questionsCount}</div>
              <div className="text-sm text-gray-500">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.answersCount}</div>
              <div className="text-sm text-gray-500">Answers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{followers.length}</div>
              <div className="text-sm text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{following.length}</div>
              <div className="text-sm text-gray-500">Following</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          {loadingQuestions ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                </Card>
              ))}
            </div>
          ) : myQuestions.length > 0 ? (
            myQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                You haven't posted any content yet.
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="followers" className="space-y-4">
          {loadingFollowers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </Card>
              ))}
            </div>
          ) : followers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followers.map((follower) => (
                <Card key={follower.uid} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={follower.photoURL || ''} alt={follower.displayName} />
                        <AvatarFallback>
                          {follower.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {follower.displayName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {follower.title || 'User'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                No followers yet.
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {loadingFollowing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </Card>
              ))}
            </div>
          ) : following.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {following.map((user) => (
                <Card key={user.uid} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                        <AvatarFallback>
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.displayName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.title || 'User'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                You're not following anyone yet.
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;