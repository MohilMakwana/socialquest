import { useMemo } from 'react';
import { Question } from '@/types';
import { SearchFilters } from '@/components/SearchFilters';

export const useSearch = (questions: Question[], filters: SearchFilters) => {
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Text search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase().trim();
      filtered = filtered.filter(question => 
        question.title.toLowerCase().includes(query) ||
        question.description.toLowerCase().includes(query) ||
        question.author.displayName.toLowerCase().includes(query) ||
        question.topics.some(topic => topic.toLowerCase().includes(query))
      );
    }

    // Tag filters
    if (filters.tags.length > 0) {
      filtered = filtered.filter(question =>
        filters.tags.some(tag => 
          question.topics.some(topic => topic.toLowerCase().includes(tag.toLowerCase()))
        )
      );
    }

    // Author filter
    if (filters.authorFilter.trim()) {
      const authorQuery = filters.authorFilter.toLowerCase().trim();
      filtered = filtered.filter(question =>
        question.author.displayName.toLowerCase().includes(authorQuery)
      );
    }

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.timeRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(question => {
        const questionDate = new Date(question.createdAt);
        return questionDate >= filterDate;
      });
    }

    // Has image filter
    if (filters.hasImage) {
      filtered = filtered.filter(question => question.imageUrl && question.imageUrl.trim() !== '');
    }

    // Minimum likes filter
    if (filters.minLikes > 0) {
      filtered = filtered.filter(question => question.likes.length >= filters.minLikes);
    }

    // Sort results
    switch (filters.sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.likes.length - a.likes.length);
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [questions, filters]);

  // Extract all available tags from questions
  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    
    questions.forEach(question => {
      question.topics.forEach(topic => {
        const tag = topic.toLowerCase().trim();
        if (tag) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    });

    // Sort tags by frequency and return top tags
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 20); // Return top 20 tags
  }, [questions]);

  return {
    filteredQuestions,
    availableTags,
    resultCount: filteredQuestions.length,
    totalCount: questions.length
  };
};