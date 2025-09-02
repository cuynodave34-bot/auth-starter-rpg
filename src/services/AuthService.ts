import { supabase } from '../lib/supabase';

export type AuthError = {
  type: 'EMAIL_NOT_FOUND' | 'WRONG_PASSWORD' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
};

export class AuthService {
  /**
   * Attempt to sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        // Check if it's an email not found error
        if (errorMessage.includes('invalid login credentials') || 
            errorMessage.includes('invalid email or password')) {
          // Try to determine if it's email not found or wrong password
          // by attempting a password reset (this won't send email if user doesn't exist)
          const resetResult = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          
          if (resetResult.error && resetResult.error.message.toLowerCase().includes('user not found')) {
            return {
              success: false,
              error: {
                type: 'EMAIL_NOT_FOUND',
                message: 'This email address is not registered in our system. Please check your email or create a new account.',
              },
            };
          } else {
            return {
              success: false,
              error: {
                type: 'WRONG_PASSWORD',
                message: 'The password you entered is incorrect. Please try again or reset your password.',
              },
            };
          }
        }

        return {
          success: false,
          error: {
            type: 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred. Please try again.',
          },
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        },
      };
    }
  }

  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, displayName: string, race: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, race },
        },
      });

      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('user already registered') || 
            errorMessage.includes('email already registered')) {
          return {
            success: false,
            error: {
              type: 'EMAIL_NOT_FOUND', // Reuse this type for "email already exists"
              message: 'This email address is already registered. Please try signing in instead.',
            },
          };
        }

        return {
          success: false,
          error: {
            type: 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred during registration.',
          },
        };
      }

      // Create profile and PlayerDB records
      if (data.user?.id) {
        await Promise.all([
          supabase.from('profiles').insert({ 
            id: data.user.id, 
            display_name: displayName, 
            race 
          }),
          supabase.from('PlayerDB').insert({ 
            uuid: data.user.id, // Use uuid column to connect tables
            username: displayName, // Same as display_name
            "Evolution Path": race, // Same as race
            status: 'Active', // Set default status to Active
            willpoints: 0,
            evofragments: 0,
            currency: 0,
            profile_picture_url: '',
            "Registration Date": new Date().toISOString(),
            "Last Login": new Date().toISOString()
          })
        ]);
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        },
      };
    }
  }

  /**
   * Reset password for an email
   */
  static async resetPassword(email: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('user not found') || 
            errorMessage.includes('email not found')) {
          return {
            success: false,
            error: {
              type: 'EMAIL_NOT_FOUND',
              message: 'This email address is not registered in our system. Please check your email or create a new account.',
            },
          };
        }

        return {
          success: false,
          error: {
            type: 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred. Please try again.',
          },
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        },
      };
    }
  }
}
