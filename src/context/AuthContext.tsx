import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User, AuthError, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient'; // Your Supabase client instance
import { isAdminEmail } from '../config/adminConfig';
import { isAdminUser } from '../utils/userManagement';
import { sendRegistrationConfirmationEmail } from '../utils/registrationEmailService';

interface UserMetadata {
  full_name?: string;
  telephone_nr?: string;
  default_shipping_address?: string;
  [key: string]: any;
}

interface SignUpResponse {
  data: { user: User | null; session: Session | null; } | null;
  error: AuthError | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
  signOut: () => Promise<void>;
  signInWithPassword: (credentials: SignInWithPasswordCredentials) => Promise<{ error: AuthError | null }>;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<SignUpResponse>;
  checkEmailExists: (email: string) => Promise<boolean>;
  checkAdminRole: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Admin check is now handled by the userManagement utility

  // Function to check if the current user is an admin
  const checkAdminRole = async (): Promise<boolean> => {
    if (!session?.user) {
      setIsAdmin(false);
      return false;
    }

    // Special handling for known admin emails - always grant admin status
    const knownAdminEmails = ['nakupi@si.si']; // Add any other known admin emails here
    if (knownAdminEmails.includes(session.user.email || '')) {
      setIsAdmin(true);

      // Cache the admin status
      localStorage.setItem(`admin_status_${session.user.id}`, 'true');
      localStorage.setItem(`admin_status_timestamp_${session.user.id}`, Date.now().toString());

      return true;
    }

    setIsAdminLoading(true);
    try {
      // Check if we have a cached admin status in localStorage
      const cachedAdminStatus = localStorage.getItem(`admin_status_${session.user.id}`);
      const cachedTimestamp = localStorage.getItem(`admin_status_timestamp_${session.user.id}`);
      const now = Date.now();

      // If we have a cached status that's less than 24 hours old, use it
      if (cachedAdminStatus && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const isWithin24Hours = now - timestamp < 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (isWithin24Hours) {
          const isAdmin = cachedAdminStatus === 'true';
          setIsAdmin(isAdmin);
          return isAdmin;
        }
      }

      // If no valid cache, check admin status using the client-side utility
      const isUserAdmin = await isAdminUser(session.user);

      // If the user is already determined to be an admin by client-side check,
      // store the result and return
      if (isUserAdmin) {
        setIsAdmin(true);
        // Cache the result in localStorage
        localStorage.setItem(`admin_status_${session.user.id}`, 'true');
        localStorage.setItem(`admin_status_timestamp_${session.user.id}`, now.toString());
        return true;
      }

      // Only call the edge function if the client-side check is inconclusive
      // and we haven't checked with the edge function recently
      const edgeFunctionChecked = localStorage.getItem(`admin_edge_checked_${session.user.id}`);
      const edgeCheckTimestamp = localStorage.getItem(`admin_edge_checked_timestamp_${session.user.id}`);

      // Extend the cache duration to 7 days to reduce edge function calls
      const EDGE_FUNCTION_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      const shouldCheckEdgeFunction = !edgeFunctionChecked ||
        !edgeCheckTimestamp ||
        (now - parseInt(edgeCheckTimestamp, 10) > EDGE_FUNCTION_CACHE_DURATION);

      // Check if we have a negative result cached (non-admin)
      const negativeResultCached = edgeFunctionChecked === 'true' &&
        localStorage.getItem(`admin_edge_result_${session.user.id}`) === 'false';

      // Skip edge function call if we have a negative result cached and it's still valid
      if (negativeResultCached && edgeCheckTimestamp &&
          (now - parseInt(edgeCheckTimestamp, 10) <= EDGE_FUNCTION_CACHE_DURATION)) {
        return false;
      }

      if (shouldCheckEdgeFunction) {
        try {
          const { data, error } = await supabase.functions.invoke('check-admin-role', {
            method: 'POST',
          });

          // Store that we've checked this user with the edge function
          localStorage.setItem(`admin_edge_checked_${session.user.id}`, 'true');
          localStorage.setItem(`admin_edge_checked_timestamp_${session.user.id}`, now.toString());

          // Store the result of the edge function check (true or false)
          const isEdgeAdmin = !error && data?.isAdmin === true;
          localStorage.setItem(`admin_edge_result_${session.user.id}`, isEdgeAdmin.toString());

          if (isEdgeAdmin) {
            // If Edge Function says user is admin, update state and cache
            setIsAdmin(true);
            localStorage.setItem(`admin_status_${session.user.id}`, 'true');
            localStorage.setItem(`admin_status_timestamp_${session.user.id}`, now.toString());
            return true;
          }
        } catch (edgeFnError) {
          console.warn('Edge Function check failed, using metadata check instead:', edgeFnError);
          // Don't update the cache on error to allow retry next time
        }
      } else {
        console.log('Skipping edge function check, recently checked for:', session.user.email);
      }

      // Store the final result in localStorage
      setIsAdmin(isUserAdmin);
      localStorage.setItem(`admin_status_${session.user.id}`, isUserAdmin.toString());
      localStorage.setItem(`admin_status_timestamp_${session.user.id}`, now.toString());
      return isUserAdmin;
    } catch (error) {
      console.error('Exception checking admin role:', error);
      setIsAdmin(false);
      return false;
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial session
    const fetchSession = async () => {
      setLoading(true); // Ensure loading is true at the start
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error.message);
        }
        setSession(session);
        setUser(session?.user ?? null);

        // Check admin role if user is logged in
        if (session?.user) {
          await checkAdminRole();
        }
      } catch (e) {
        console.error("Exception fetching session:", e);
      } finally {
        setLoading(false); // Set loading false after fetch attempt
      }
    };

    fetchSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Check admin role if user is logged in
        if (session?.user) {
          await checkAdminRole();
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Cleanup listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);

    // Clear admin cache before signing out
    if (user) {
      try {
        // Import dynamically to avoid circular dependency
        const { clearAdminCache } = await import('../utils/userManagement');
        clearAdminCache(user.id);
      } catch (err) {
        console.error("Error clearing admin cache:", err);
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      // Potentially show user feedback
    }

    // State updates handled by onAuthStateChange listener
    setLoading(false); // Set loading false after sign out attempt
  };

  const signInWithPassword = async (credentials: SignInWithPasswordCredentials) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) {
      console.error("Sign in error:", error.message);
    }
    // State updates handled by onAuthStateChange listener
    setLoading(false);
    return { error };
  };

  // Updated signUp to handle profile creation
  const signUp = async (credentials: SignUpWithPasswordCredentials): Promise<SignUpResponse> => {
    setLoading(true);
    try {
      // Create the auth user (Supabase will handle basic auth)
      const { data, error } = await supabase.auth.signUp({
        email: (credentials as { email: string }).email,
        password: (credentials as { password: string }).password
      });

      if (error) {
        console.error("Sign up error:", error.message);
        return { data: null, error };
      }

      if (!data.user) {
        const err = new Error('User creation failed') as AuthError;
        return { data: null, error: err };
      }

      // Then create the profile with the metadata if provided
      if (credentials.options?.data) {
        const metadata = (credentials.options.data || {}) as UserMetadata;

        // Create profile with regular client
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              updated_at: new Date().toISOString(),
              username: metadata.full_name || '',
              full_name: metadata.full_name || '',
              avatar_url: '',
              website: '',
              email: (credentials as { email: string }).email,
              telephone_nr: metadata.telephone_nr || '',
              default_shipping_address: metadata.default_shipping_address
            }, { onConflict: 'id' });

          if (profileError) {
            console.error("Profile creation error during signup:", profileError);
          }

          // Send simple welcome email (like newsletter confirmation)
          try {
            const emailResult = await sendRegistrationConfirmationEmail({
              email: (credentials as { email: string }).email,
              fullName: metadata.full_name,
              userId: data.user.id,
              language: 'sl'
            });

            console.log('Welcome email result:', emailResult);
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Don't fail registration if email fails
          }
      }

      return { data, error: null };
    } catch (err) {
      console.error("Unexpected error during sign up:", err);
      return { data: null, error: err as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // Check if email exists in the system
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Using a more reliable method that doesn't depend on OTP configuration
      // This is a simple check that just verifies if the email format is valid
      // In a production environment, you would want to implement this on the server side
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        return false;
      }

      // For demonstration purposes, we'll assume the email exists if it's properly formatted
      // In a real application, you would check against your user database
      return true;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  };

  const value = {
    session,
    user,
    loading,
    isAdmin,
    isAdminLoading,
    signOut,
    signInWithPassword,
    signUp,
    checkEmailExists,
    checkAdminRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children} {/* Render children immediately, loading state handled internally */}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
