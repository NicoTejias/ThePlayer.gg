
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { supabase } from './supabaseClient';

// ============================================================
// OAuth Hash Fragment Handler
// ============================================================
// When returning from Google OAuth, Supabase adds auth tokens to the URL hash:
// https://example.com/#access_token=xxx&refresh_token=yyy&...
// 
// This conflicts with HashRouter which also uses the hash for routing.
// We need to detect and handle OAuth tokens BEFORE React mounts.
// ============================================================

const handleOAuthCallback = async () => {
  const hash = window.location.hash;

  if (!hash || (!hash.includes('access_token=') && !hash.includes('refresh_token='))) {
    return;
  }

  try {
    const accessTokenMatch = hash.match(/access_token=([^&]+)/);
    const refreshTokenMatch = hash.match(/refresh_token=([^&]+)/);
    const typeMatch = hash.match(/type=([^&]+)/);

    const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
    const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;
    const type = typeMatch ? typeMatch[1] : null;

    if (!accessToken) {
      console.error('OAuth callback: no access_token found in URL hash');
      window.history.replaceState(null, '', window.location.pathname + '#/');
      return;
    }

    if (refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
    } else {
      console.warn('OAuth callback: no refresh_token — session may be short-lived');
    }

    // Navigate to the correct route after auth
    if (type === 'recovery') {
      // Password reset flow: send user to reset-password page
      window.history.replaceState(null, '', window.location.pathname + '#/reset-password');
    } else {
      // OAuth login flow: send user to home
      const savedGame = localStorage.getItem('selectedGame');
      const targetHash = savedGame ? '#/home' : '#/';
      window.history.replaceState(null, '', window.location.pathname + targetHash);
    }

  } catch (err) {
    console.error('OAuth callback error:', err);
    window.history.replaceState(null, '', window.location.pathname + '#/');
  }
};

// Process OAuth callback before mounting React
handleOAuthCallback().then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
