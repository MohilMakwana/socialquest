import { useState, useEffect } from 'react';
import { User, MessageCircle, Heart, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useRealtimeCollection } from '@/hooks/useFirestore';
import { UserStats, User as UserType } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const { getUserStats } = useFirestore();
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats>({ questionsCount: 0, answersCount: 0, likesReceived: 0 });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    title: userProfile?.title || '',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    isPrivate: userProfile?.isPrivate || false,
  });

  // Get all users to display follower/following info
  const { data: allUsers } = useRealtimeCollection<UserType>('users', []);
  
  const followersData = allUsers.filter(user => 
    userProfile?.followers.includes(user.uid)
  );
  
  const followingData = allUsers.filter(user => 
    userProfile?.following.includes(user.uid)
  );

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        title: userProfile.title || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        isPrivate: userProfile.isPrivate || false,
      });
      
      getUserStats(userProfile.uid).then(setStats).catch(console.error);
    }
  }, [userProfile, getUserStats]);

  const handleSave = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      console.log('Saving profile data:', formData);
      await updateUserProfile(formData);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Dashboard save error:', error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!userProfile) return null;

  return (
    <div className="w-full">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.questionsCount}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Questions Asked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.answersCount}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Answers Given</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full">
                  <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.likesReceived}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Likes Received</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => handleInputChange('isPrivate', checked)}
                />
                <Label htmlFor="isPrivate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Private Profile
                </Label>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mt-1 flex-1 min-h-[100px]"
                  rows={3}
                />
              </div>
              
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Followers/Following */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Followers ({userProfile.followers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {followersData.length > 0 ? (
                  followersData.slice(0, 5).map((follower) => (
                    <div key={follower.uid} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={follower.photoURL || ''} alt={follower.displayName} />
                          <AvatarFallback>
                            {follower.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {follower.displayName}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {follower.title || 'User'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Message
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No followers yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Following ({userProfile.following.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {followingData.length > 0 ? (
                  followingData.slice(0, 5).map((following) => (
                    <div key={following.uid} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={following.photoURL || ''} alt={following.displayName} />
                          <AvatarFallback>
                            {following.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {following.displayName}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {following.title || 'User'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Unfollow
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Not following anyone yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
