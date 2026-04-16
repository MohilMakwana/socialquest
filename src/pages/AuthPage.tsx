import { useState } from 'react';
import { Mail, Lock, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(formData.email, formData.password);
        toast({
          title: "Welcome Back!",
          description: "Successfully logged in.",
        });
      } else {
        await register(formData.email, formData.password, formData.displayName);
        toast({
          title: "Welcome to QuoraClone!",
          description: "Account created successfully.",
        });
      }
    } catch (error: any) {
      console.error("Auth Exception Block:", error);
      let errorMessage = error instanceof Error ? error.message : "An error occurred";
      
      if (error?.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/Password sign-in is explicitly DISABLED in your Firebase Project Console. You must enable it.";
      } else if (error?.code === 'permission-denied') {
        errorMessage = "Your Firestore Security Rules are blocking writes. Please update them in the console to allow authenticated access.";
      } else if (error?.code === 'auth/invalid-credential') {
        errorMessage = "Incorrect email address or password provided.";
      } else if (error?.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already associated with an account.";
      }

      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
      {/* Left side: Premium Branding Cover */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary via-indigo-600 to-purple-800 text-white flex-col justify-center items-center relative overflow-hidden">
        {/* Abstract decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-400 opacity-20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        
        <div className="z-10 text-center px-12 max-w-lg">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Sparkles className="w-12 h-12 text-blue-200" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-md">
            Join the global knowledge exchange.
          </h1>
          <p className="text-lg text-indigo-100 font-medium leading-relaxed mb-4">
            QuoraClone is a community where curiosity meets expertise. Connect with thinkers, creators, and experts.
          </p>
        </div>
      </div>

      {/* Right side: Modern Glassmorphism Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-white/20 shadow-2xl p-4 sm:p-8 rounded-3xl">
          <CardContent className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 drop-shadow-sm mb-2">
                {isLoginMode ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {isLoginMode ? 'Sign in to jump back into the discussion.' : 'Register to start sharing knowledge.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLoginMode && (
                <div className="space-y-1">
                  <Label htmlFor="displayName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="displayName"
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      placeholder="John Doe"
                      className="pl-11 py-6 bg-white/50 dark:bg-gray-800/50 border-gray-200 focus:ring-2 focus:ring-primary/50 transition-all shadow-sm rounded-xl"
                      required={!isLoginMode}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="you@example.com"
                    className="pl-11 py-6 bg-white/50 dark:bg-gray-800/50 border-gray-200 focus:ring-2 focus:ring-primary/50 transition-all shadow-sm rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="pl-11 py-6 bg-white/50 dark:bg-gray-800/50 border-gray-200 focus:ring-2 focus:ring-primary/50 transition-all shadow-sm rounded-xl"
                    required
                  />
                </div>
              </div>

              {isLoginMode && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                    />
                    <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-400">
                      Remember me
                    </Label>
                  </div>
                  <Button variant="link" size="sm" type="button" className="text-sm text-primary hover:text-indigo-600 p-0 font-semibold" onClick={(e) => e.preventDefault()}>
                    Forgot password?
                  </Button>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg transform hover:scale-[1.02] transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {isLoginMode ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  isLoginMode ? 'Sign In' : 'Join QuoraClone'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLoginMode ? "Ready to share your knowledge?" : "Already part of the community?"}
                <button
                  type="button"
                  className="font-bold text-primary hover:text-indigo-600 ml-2 hover:underline transition-all"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                >
                  {isLoginMode ? 'Create an account' : 'Sign in instead'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
