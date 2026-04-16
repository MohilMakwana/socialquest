import { useState } from 'react';
import { X, Upload, Loader2, MessageSquare, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore } from '@/hooks/useFirestore';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { useToast } from '@/hooks/use-toast';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const { addQuestion } = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('question');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !title.trim()) return;

    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        try {
          const uploadResult = await uploadImageToCloudinary(imageFile);
          imageUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast({
            title: "Image upload failed",
            description: "Could not upload image. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      const questionId = await addQuestion({
        type: activeTab as 'question' | 'post',
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        authorId: currentUser.uid,
        author: {
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL || '',
          title: userProfile.title || '',
        },
        likes: [],
        topics: topics.split(',').map(topic => topic.trim()).filter(Boolean),
      });

      toast({
        title: "Question posted successfully!",
        description: "Your question has been shared with the community.",
      });

      // Reset form
      setTitle('');
      setDescription('');
      setTopics('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error('Failed to create question:', error);
      toast({
        title: "Failed to post question",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Content</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="question" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Ask Question</span>
              </TabsTrigger>
              <TabsTrigger value="post" className="flex items-center space-x-2">
                <Edit3 className="h-4 w-4" />
                <span>Add Post</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="question">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question Title
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What would you like to ask?"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide more details about your question..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="image" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Image (Optional)
                  </Label>
                  <div className="mt-1">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="inline-block cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>

                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="topics" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Topics
                  </Label>
                  <Input
                    id="topics"
                    type="text"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="Add topics (comma separated)"
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !title.trim()}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post Question'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="post">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="post-title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Post Title
                  </Label>
                  <Input
                    id="post-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's on your mind?"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="post-content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Content
                  </Label>
                  <Textarea
                    id="post-content"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Share your thoughts, experiences, or insights..."
                    rows={4}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="post-topics" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Topics (comma-separated)
                  </Label>
                  <Input
                    id="post-topics"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="e.g., technology, career, lifestyle"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Image (optional)
                  </Label>
                  <div className="mt-1 flex items-center space-x-4">
                    <input
                      title='image'
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="post-image-upload"
                    />
                    <Label
                      htmlFor="post-image-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </Label>
                    {imageFile && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {imageFile.name}
                      </span>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !title.trim() || !description.trim()}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      'Share Post'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestionModal;
