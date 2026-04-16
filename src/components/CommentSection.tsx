import { useState } from 'react';
import { Heart, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useRealtimeCollection } from '@/hooks/useFirestore';
import { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface CommentSectionProps {
  questionId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ questionId }) => {
  const { currentUser, userProfile } = useAuth();
  const { addComment, toggleLike } = useFirestore();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

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

  const { data: rawComments, loading } = useRealtimeCollection<Comment>('comments', [
    where('questionId', '==', questionId)
  ]);
  
  const comments = rawComments.sort((a, b) => getValidDate(b.createdAt).getTime() - getValidDate(a.createdAt).getTime());

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !newComment.trim()) return;

    try {
      await addComment({
        content: newComment,
        authorId: currentUser.uid,
        author: {
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
        },
        questionId,
        likes: [],
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !replyContent.trim()) return;

    try {
      await addComment({
        content: replyContent,
        authorId: currentUser.uid,
        author: {
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
        },
        questionId,
        parentId,
        likes: [],
      });
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) return;
    
    try {
      await toggleLike('comments', commentId, currentUser.uid);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Separate parent comments and replies
  const parentComments = comments.filter(comment => !comment.parentId);
  const replies = comments.filter(comment => comment.parentId);

  const getRepliesForComment = (commentId: string) => {
    return replies.filter(reply => reply.parentId === commentId);
  };

  if (loading) {
    return (
      <div className="mt-6 pt-4 border-t dark:border-gray-700 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="flex items-start space-x-3">
             <Skeleton className="h-8 w-8 rounded-full" />
             <div className="flex-1 space-y-2">
               <Skeleton className="h-20 w-full rounded-lg" />
               <div className="flex space-x-2">
                 <Skeleton className="h-4 w-12" />
                 <Skeleton className="h-4 w-12" />
               </div>
             </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
        Answers ({parentComments.length})
      </h4>
      
      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {parentComments.map((comment) => {
          const commentReplies = getRepliesForComment(comment.id);
          const createdAt = comment.createdAt instanceof Date 
            ? comment.createdAt 
            : new Date(comment.createdAt);
          const isLiked = comment.likes.includes(currentUser?.uid || '');

          return (
            <div key={comment.id} className="space-y-3">
              {/* Parent Comment */}
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.photoURL || ''} alt={comment.author.displayName} />
                  <AvatarFallback>
                    {comment.author.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {comment.author.displayName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(getValidDate(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center space-x-1 text-sm ${
                        isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                      } hover:text-red-500`}
                    >
                      <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likes.length}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                  
                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-3">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="mb-2"
                        rows={2}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm">
                          Reply
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Replies */}
              {commentReplies.length > 0 && (
                <div className="ml-11 space-y-3">
                  {commentReplies.map((reply) => {
                    const replyCreatedAt = getValidDate(reply.createdAt);
                    const isReplyLiked = reply.likes.includes(currentUser?.uid || '');

                    return (
                      <div key={reply.id} className="flex items-start space-x-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={reply.author.photoURL || ''} alt={reply.author.displayName} />
                          <AvatarFallback>
                            {reply.author.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {reply.author.displayName}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(replyCreatedAt, { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                              {reply.content}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeComment(reply.id)}
                              className={`flex items-center space-x-1 text-xs ${
                                isReplyLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                              } hover:text-red-500`}
                            >
                              <Heart className={`h-3 w-3 ${isReplyLiked ? 'fill-current' : ''}`} />
                              <span>{reply.likes.length}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={userProfile?.photoURL || ''} alt={userProfile?.displayName || ''} />
          <AvatarFallback>
            {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your answer..."
            className="mb-2"
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!newComment.trim()}>
              Post Answer
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CommentSection;
