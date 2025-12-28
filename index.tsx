
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

  // Check if the hash contains OAuth tokens (access_token)
  // We use includes checks to be safe before doing heavy parsing
  if (hash && (hash.includes('access_token=') || hash.includes('refresh_token='))) {
    console.log('🔐 OAuth callback detected, processing tokens...');
    console.log('Raw hash:', hash);

    try {
      // Robust extraction using Regex to handle various router hash prefix scenarios
      // Matches both "access_token=XYZ" and "access_token=XYZ&" patterns
      const accessTokenMatch = hash.match(/access_token=([^&]+)/);
      const refreshTokenMatch = hash.match(/refresh_token=([^&]+)/);
      const typeMatch = hash.match(/type=([^&]+)/);

      const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
      const refreshToken = refreshTokenMatch ? refreshTokenMatch[1] : null;
      const type = typeMatch ? typeMatch[1] : null;

      console.log('Extracted structure:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type: type
      });

      if (accessToken) {
        if (refreshToken) {
          console.log('🔑 Setting session from OAuth tokens (Access + Refresh)...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          console.log('✅ Session established successfully with Refresh Token!');
          console.log('👤 User:', data.user?.email);
        } else {
          // Fallback: This is unusual for 'offline' access_type but might happen
          console.log('⚠️ Warning: No refresh_token found. Setting session with access_token only.');
          // supabase.auth.setSession supports partial sessions in some contexts or we might just rely on the token
          // However, types usually require both. Let's try passing what we have if the library allows it, 
          // otherwise we might need to manually set the cookie or just accept that session might be short lived.
          // For now, let's try standard setSession and see if it accepts it or throw.
          // Note: setSession({ access_token, refresh_token }) expects refresh_token.
          // If we don't have it, we can't persist the session efficiently.
          console.error('❌ Cannot set session: Missing refresh_token.');
        }
      } else {
        console.error('❌ OAuth detected but could not extract access_token.');
      }

      // Clean the URL by removing OAuth params and redirect to home
      // We explicitly clear the hash to a clean state
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
