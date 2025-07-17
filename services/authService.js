import { supabaseAuth } from '../config/supabase.js';

export const authService = {
  async signInWithPassword(email, password) {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    };
  },

  async signOut() {
    const { error } = await supabaseAuth.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Signed out successfully' };
  },

  async getUser(token) {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    return {
      user: {
        id: user.id,
        email: user.email
      }
    };
  }
};