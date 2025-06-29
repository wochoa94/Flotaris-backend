import { authService } from '../services/authService.js';

export const authController = {
  async signIn(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.signInWithPassword(email, password);
      res.json(result);
    } catch (error) {
      console.error('Sign in error:', error);
      res.status(401).json({ error: error.message });
    }
  },

  async signOut(req, res) {
    try {
      const result = await authService.signOut();
      res.json(result);
    } catch (error) {
      console.error('Sign out error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  async getSession(req, res) {
    try {
      res.json({
        user: {
          id: req.user.id,
          email: req.user.email
        }
      });
    } catch (error) {
      console.error('Session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};