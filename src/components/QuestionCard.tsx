import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore } from '@/hooks/useFirestore';
import { Question } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';

interface QuestionCardProps {
  question: Question;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { currentUser, userProfile } = useAuth();
  const { toggleLike, saveQuestion } = useFirestore();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(
    question.likes.includes(currentUser?.uid || '')
  );
  const [isSaved, setIsSaved] = useState(
    userProfile?.savedQuestions?.includes(question.id) || false
  );

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

  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      await toggleLike('questions', question.id, currentUser.uid);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    try {
      const newSaveState = await saveQuestion(question.id, currentUser.uid);
      setIsSaved(newSaveState ?? false);
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: question.title,
          text: question.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const createdAt = getValidDate(question.createdAt);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 backdrop-blur-md transition-colors duration-200">
      <div className="p-5 sm:p-6 pb-4 cursor-default">
        {/* Question Header */}
        <div className="flex items-start space-x-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={question.author.photoURL || ''} alt={question.author.displayName} />
            <AvatarFallback>
              {question.author.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-white inline-flex items-center">
                {question.author.displayName}
                <span className="font-normal text-gray-500 dark:text-gray-400 text-sm ml-2">
                  {question.type === 'post' ? 'shared a post' : 'asked a question'}
                </span>
              </h3>
              <span className="text-gray-500 dark:text-gray-400">•</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {question.author.title || 'User'}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Question Content */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            {question.title}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {question.description}
          </p>
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Question image"
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          
          {/* Topics */}
          {question.topics && question.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {question.topics.map((topic, index) => (
                <Badge key={index} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Question Actions */}
        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 ${
                isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
              } hover:text-red-500 transition-colors`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{question.likes.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comments</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={`flex items-center space-x-2 ${
              isSaved ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-400'
            } hover:text-yellow-500 transition-colors`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            <span>Save</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <CommentSection questionId={question.id} />
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
