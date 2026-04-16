export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  title?: string;
  location?: string;
  followers: string[];
  following: string[];
  savedQuestions?: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  type?: 'question' | 'post';
  title: string;
  description: string;
  imageUrl?: string;
  authorId: string;
  author: {
    displayName: string;
    photoURL?: string;
    title?: string;
  };
  likes: string[];
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: {
    displayName: string;
    photoURL?: string;
  };
  questionId: string;
  parentId?: string;
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  updatedAt: Date;
}

export interface UserStats {
  questionsCount: number;
  answersCount: number;
  likesReceived: number;
}
