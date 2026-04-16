import { Link, useLocation } from 'wouter';
import { Home, User, Bookmark, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/hooks/useFirestore';
import { useEffect, useState } from 'react';
import { UserStats } from '@/types';

const Sidebar: React.FC = () => {
  const { userProfile } = useAuth();
  const [location] = useLocation();
  const { getUserStats } = useFirestore();
  const [stats, setStats] = useState<UserStats>({ questionsCount: 0, answersCount: 0, likesReceived: 0 });

  useEffect(() => {
    if (userProfile) {
      getUserStats(userProfile.uid).then(setStats).catch(console.error);
    }
  }, [userProfile, getUserStats]);

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/saved', label: 'Saved', icon: Bookmark },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Card className="sticky top-24 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-100 dark:border-gray-800 shadow-lg transition-all duration-500 rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* User Profile Section */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userProfile?.photoURL || ''} alt={userProfile?.displayName || ''} />
              <AvatarFallback>
                {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {userProfile?.displayName || 'User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userProfile?.title || 'User'}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{stats.questionsCount}</div>
              <div className="text-xs text-gray-500">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{stats.answersCount}</div>
              <div className="text-xs text-gray-500">Answers</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 pt-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start space-x-3 ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-md transform scale-105 transition-all duration-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </CardContent>
    </Card>
  );
};

export default Sidebar;
