import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  updatePassword,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  // login: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<UserCredential>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      if (user) {
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', user.uid), 
          (userDoc) => {
            if (userDoc.exists()) {
              setUserProfile(userDoc.data() as User);
            } else {
              console.warn("User authenticated natively but missing Firestore profile.");
              setUserProfile(null);
            }
          }, 
          (error) => console.error("Permission denied reading profile.", error)
        );
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    
    // Create user profile in Firestore
    const userProfile: User = {
      uid: result.user.uid,
      email: result.user.email!,
      displayName,
      photoURL: '',
      bio: '',
      title: '',
      location: '',
      followers: [],
      following: [],
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    try {
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      setUserProfile(userProfile);
      console.log('User registered and profile created:', userProfile);
    } catch (setDocError) {
      console.error("Failed to commit user profile to Firestore. Check Firebase Rules.", setDocError);
      throw setDocError;
    }
  };

  const logout = async () => {
    return signOut(auth);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    
    console.log('Updating user profile with data:', data);
    
    const updatedData = { ...data, updatedAt: new Date() };
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updatedData);
      
      if (data.displayName) {
        await updateProfile(currentUser, { displayName: data.displayName });
      }
      
      setUserProfile(prev => prev ? { ...prev, ...updatedData } : null);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!currentUser) return;
    return updatePassword(currentUser, newPassword);
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    updateUserProfile,
    changePassword,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
