import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
  getDocs,
  queryEqual
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Question, Comment, User, ChatMessage, UserStats } from '@/types';

export const useFirestore = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = async (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'questions'), {
        ...question,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'comments'), {
        ...comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (collectionName: string, docId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const likes = docSnap.data().likes || [];
        const isLiked = likes.includes(userId);

        await updateDoc(docRef, {
          likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle like');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (currentUserId: string, targetUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      const targetUserRef = doc(db, 'users', targetUserId);

      await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId),
      });

      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUserId),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to follow user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (currentUserId: string, targetUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      const targetUserRef = doc(db, 'users', targetUserId);

      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId),
      });

      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unfollow user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        ...message,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = async (userId: string): Promise<UserStats> => {
    setLoading(true);
    setError(null);
    try {
      const questionsQuery = query(
        collection(db, 'questions'),
        where('authorId', '==', userId)
      );
      const questionsSnapshot = await getDocs(questionsQuery);

      const commentsQuery = query(
        collection(db, 'comments'),
        where('authorId', '==', userId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);

      // Calculate total likes received
      let likesReceived = 0;
      questionsSnapshot.forEach(doc => {
        const data = doc.data();
        likesReceived += (data.likes || []).length;
      });

      commentsSnapshot.forEach(doc => {
        const data = doc.data();
        likesReceived += (data.likes || []).length;
      });

      return {
        questionsCount: questionsSnapshot.size,
        answersCount: commentsSnapshot.size,
        likesReceived,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get user stats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveQuestion = async (questionId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const savedQuestions = userData.savedQuestions || [];
        const isSaved = savedQuestions.includes(questionId);

        await updateDoc(userRef, {
          savedQuestions: isSaved ? arrayRemove(questionId) : arrayUnion(questionId),
          updatedAt: new Date(),
        });

        return !isSaved;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    addQuestion,
    addComment,
    toggleLike,
    saveQuestion,
    followUser,
    unfollowUser,
    sendMessage,
    getUserStats,
  };
};

export const useRealtimeCollection = <T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState(() => query(collection(db, collectionName), ...constraints));

  useEffect(() => {
    const newQ = query(collection(db, collectionName), ...constraints);
    setQ((prevQ) => {
      // Use queryEqual to guarantee references only update when query conditions tangibly change
      if (queryEqual(prevQ, newQ)) {
        return prevQ; 
      }
      return newQ;
    });
  }, [collectionName, constraints]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as T[];
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore Listen Error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [q]);

  return { data, loading, error };
};
