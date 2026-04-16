import { useState } from 'react';
import { Search, Filter, X, Calendar, User, Tag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export interface SearchFilters {
  query: string;
  tags: string[];
  sortBy: 'recent' | 'popular' | 'oldest';
  timeRange: 'all' | 'today' | 'week' | 'month' | 'year';
  hasImage: boolean;
  minLikes: number;
  authorFilter: string;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags: string[];
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  availableTags
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const addTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      updateFilters({ tags: [...filters.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateFilters({ tags: filters.tags.filter(t => t !== tag) });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      query: '',
      tags: [],
      sortBy: 'recent',
      timeRange: 'all',
      hasImage: false,
      minLikes: 0,
      authorFilter: '',
    });
  };

  const hasActiveFilters = filters.tags.length > 0 ||
    filters.timeRange !== 'all' ||
    filters.hasImage ||
    filters.minLikes > 0 ||
    filters.authorFilter !== '';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 mb-6">
      {/* Main Search Bar */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search questions, topics, or users..."
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            className="pl-10"
          />
        </div>

        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={hasActiveFilters ? "text-blue-600 border-blue-600" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Sort Options */}
              <div>
                <Label className="text-sm font-medium">Sort by</Label>
                <Select value={filters.sortBy} onValueChange={(value: any) => updateFilters({ sortBy: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range */}
              <div>
                <Label className="text-sm font-medium">Time Range</Label>
                <Select value={filters.timeRange} onValueChange={(value: any) => updateFilters({ timeRange: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Author Filter */}
              <div>
                <Label className="text-sm font-medium">Author</Label>
                <Input
                  placeholder="Filter by author name..."
                  value={filters.authorFilter}
                  onChange={(e) => updateFilters({ authorFilter: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Minimum Likes */}
              <div>
                <Label className="text-sm font-medium">Minimum Likes</Label>
                <Input
                  type="number"
                  min="0"
                  value={filters.minLikes}
                  onChange={(e) => updateFilters({ minLikes: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              {/* Has Image Filter */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasImage"
                  checked={filters.hasImage}
                  onCheckedChange={(checked) => updateFilters({ hasImage: !!checked })}
                />
                <Label htmlFor="hasImage" className="text-sm">Has Image</Label>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Tags Section */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <Label className="text-sm font-medium">Tags</Label>
        </div>

        {/* Tag Input */}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(tagInput.trim());
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={() => addTag(tagInput.trim())}
            disabled={!tagInput.trim()}
            size="sm"
          >
            Add
          </Button>
        </div>

        {/* Popular Tags */}
        {availableTags.length > 0 && (
          <div>
            <Label className="text-xs text-gray-500">Popular tags:</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {availableTags.slice(0, 10).map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => addTag(tag)}
                  disabled={filters.tags.includes(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Tags */}
        {filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                <span>{tag}</span>
                <button
                  title='remove'
                  onClick={() => removeTag(tag)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {Object.values(filters).filter(Boolean).length} filters active
            </span>
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;