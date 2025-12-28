
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

  // Check if the hash contains OAuth tokens (not a route)
  if (hash && hash.includes('access_token=')) {
    console.log('🔐 OAuth callback detected, processing tokens...');

    try {
      // Extract the fragment (remove the leading #)
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('🔑 Setting session from OAuth tokens...');

        // Set the session using the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('❌ Error setting session from OAuth:', error);
        } else {
          console.log('✅ Session established successfully!');
          console.log('👤 User:', data.user?.email);
        }
      }

      // Clean the URL by removing OAuth params and redirect to home
      window.history.replaceState(null, '', window.location.pathname + '#/');

    } catch (err) {
      console.error('❌ OAuth callback handling error:', err);
      // Still clean the URL even on error
      window.history.replaceState(null, '', window.location.pathname + '#/');
    }
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
