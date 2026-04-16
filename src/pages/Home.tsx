import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeCollection } from '@/hooks/useFirestore';
import { Question } from '@/types';
import { orderBy } from 'firebase/firestore';
import QuestionCard from '@/components/QuestionCard';
import CreateQuestionModal from '@/components/modals/CreateQuestionModal';
import SearchFilters, { SearchFilters as SearchFiltersType } from '@/components/SearchFilters';
import { useSearch } from '@/hooks/useSearch';
import { Plus, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Home: React.FC = () => {
  const { userProfile } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({
    query: '',
    tags: [],
    sortBy: 'recent',
    timeRange: 'all',
    hasImage: false,
    minLikes: 0,
    authorFilter: '',
  });

  // Get all questions for feed
  const { data: allQuestions, loading } = useRealtimeCollection<Question>('questions', [
    orderBy('createdAt', 'desc')
  ]);

  // Create personalized feed logic (stable sorting to prevent infinite loops)
  const personalizedQuestions = useMemo(() => {
    if (!userProfile || !allQuestions?.length) return allQuestions || [];

    const followedUserIds = userProfile.following || [];
    const followedUserQuestions = allQuestions.filter(q => followedUserIds.includes(q.authorId));
    const otherQuestions = allQuestions.filter(q => !followedUserIds.includes(q.authorId) && q.authorId !== userProfile.uid);
    
    // Sort other questions by creation date for stable ordering
    const sortedOtherQuestions = otherQuestions.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    // Combine: followed users' posts first, then others by date
    return [...followedUserQuestions, ...sortedOtherQuestions];
  }, [allQuestions, userProfile?.following]);

  const { filteredQuestions, availableTags, resultCount, totalCount } = useSearch(personalizedQuestions || [], searchFilters);

  return (
    <div className="space-y-6">
      {/* Ask Question Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.photoURL || ''} alt={userProfile?.displayName || ''} />
              <AvatarFallback>
                {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              className="flex-1 justify-start text-gray-500 dark:text-gray-400"
              onClick={() => setShowCreateModal(true)}
            >
              What would you like to ask or share?
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t dark:border-gray-700">
            <Button
              variant="default"
              className="flex items-center space-x-2 px-6"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Post</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center space-x-2 px-6"
              onClick={() => setShowCreateModal(true)}
            >
              <span>Ask Question</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Filters */}
      <SearchFilters
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        availableTags={availableTags}
      />

      {/* Results Summary */}
      {(searchFilters.query || searchFilters.tags.length > 0 || searchFilters.timeRange !== 'all' || searchFilters.hasImage || searchFilters.minLikes > 0 || searchFilters.authorFilter) && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Showing {resultCount} of {totalCount} results
            </span>
          </div>
          {searchFilters.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-600">Tags:</span>
              {searchFilters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Question Feed */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[60%]" />
                    <Skeleton className="h-4 w-[40%]" />
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-[90%]" />
                  <Skeleton className="h-5 w-[80%]" />
                </div>
                <div className="flex items-center space-x-4 mt-6 pt-4 border-t dark:border-gray-800">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredQuestions.length > 0 ? (
        filteredQuestions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))
      ) : (
        <div className="text-center py-8">
          {resultCount === 0 && totalCount > 0 ? (
            <div className="space-y-4">
              <div className="text-gray-500 dark:text-gray-400">
                No questions match your search criteria.
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSearchFilters({
                  query: '',
                  tags: [],
                  sortBy: 'recent',
                  timeRange: 'all',
                  hasImage: false,
                  minLikes: 0,
                  authorFilter: '',
                })}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              No questions yet. Be the first to ask!
            </div>
          )}
        </div>
      )}

      <CreateQuestionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default Home;
