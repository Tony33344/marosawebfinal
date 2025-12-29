/**
 * Admin Security Utilities
 *
 * This module provides functions for securing admin access
 * with additional security measures.
 */

import { supabase } from '../lib/supabaseClient';
import { ADMIN_SESSION_TIMEOUT, isAdminEmail } from '../config/adminConfig';

// Admin session timeout is now imported from adminConfig

// Storage key for admin session
const ADMIN_SESSION_KEY = 'admin_session';
const ADMIN_SESSION_STORAGE_KEY = 'admin_session_storage';

// Admin session interface
interface AdminSession {
  timestamp: number;
  verified: boolean;
}

/**
 * Checks if the current user has a valid admin session
 * @returns True if the user has a valid admin session, false otherwise
 */
export async function hasValidAdminSession(): Promise<boolean> {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check both sessionStorage and localStorage for admin session
    let sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);

    // If not in sessionStorage, try localStorage
    if (!sessionData) {
      sessionData = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

      // If not in localStorage either, return false
      if (!sessionData) return false;
    }

    const session: AdminSession = JSON.parse(sessionData);
    const now = Date.now();

    // Check if session is expired
    if (now - session.timestamp > ADMIN_SESSION_TIMEOUT) {
      // Session expired, remove it from both storages
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return false;
    }

    // Check if session is verified
    if (!session.verified) return false;

    // Session is valid, update timestamp in both storages
    session.timestamp = now;
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));

    return true;
  } catch (error) {
    console.error('Error checking admin session:', error);
    return false;
  }
}

/**
 * Creates a new admin session
 * @returns True if the session was created successfully, false otherwise
 */
export async function createAdminSession(): Promise<boolean> {
  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if we have a cached admin status in localStorage
    const cachedAdminStatus = localStorage.getItem(`admin_status_${user.id}`);
    const cachedTimestamp = localStorage.getItem(`admin_status_timestamp_${user.id}`);
    const now = Date.now();

    // If we have a cached status that's less than 7 days old, use it
    if (cachedAdminStatus && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      const isWithin7Days = now - timestamp < 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      if (isWithin7Days && cachedAdminStatus === 'true') {
        console.log('Using cached admin status to create session for:', user.email);

        // Create a new admin session
        const session: AdminSession = {
          timestamp: now,
          verified: true
        };

        // Store in both sessionStorage and localStorage for persistence
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
        return true;
      }
    }

    // If no valid cache, check if the user's email is in the admin list
    const isAdmin = isAdminEmail(user.email);

    if (isAdmin) {
      console.log('Creating admin session for admin by email:', user.email);

      // Cache the admin status
      localStorage.setItem(`admin_status_${user.id}`, 'true');
      localStorage.setItem(`admin_status_timestamp_${user.id}`, now.toString());

      // Create a new admin session
      const session: AdminSession = {
        timestamp: now,
        verified: true
      };

      // Store in both sessionStorage and localStorage for persistence
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
      return true;
    }

    // If not admin by email, check user metadata without making an edge function call
    if (user.user_metadata && user.user_metadata.is_admin === true) {
      console.log('Creating admin session for admin by metadata:', user.email);

      // Cache the admin status
      localStorage.setItem(`admin_status_${user.id}`, 'true');
      localStorage.setItem(`admin_status_timestamp_${user.id}`, now.toString());

      // Create a new admin session
      const session: AdminSession = {
        timestamp: now,
        verified: true
      };

      // Store in both sessionStorage and localStorage for persistence
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
      return true;
    }

    console.log('User is not an admin:', user.email);
    return false;
  } catch (error) {
    console.error('Error creating admin session:', error);

    // For development purposes, create a session anyway
    if (import.meta.env.DEV) {
      console.log('Creating admin session despite error (development mode)');
      const session: AdminSession = {
        timestamp: Date.now(),
        verified: true
      };
      // Store in both sessionStorage and localStorage for persistence
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
      return true;
    }

    return false;
  }
}

/**
 * Invalidates the current admin session
 */
export function invalidateAdminSession(): void {
  // Remove from both sessionStorage and localStorage
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

/**
 * Refreshes the current admin session if it exists
 * @returns True if the session was refreshed successfully, false otherwise
 */
export async function refreshAdminSession(): Promise<boolean> {
  try {
    // Check both sessionStorage and localStorage for admin session
    let sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);

    // If not in sessionStorage, try localStorage
    if (!sessionData) {
      sessionData = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

      // If not in localStorage either, return false
      if (!sessionData) return false;
    }

    // Parse the session
    const session: AdminSession = JSON.parse(sessionData);

    // Check if session is expired
    const now = Date.now();
    if (now - session.timestamp > ADMIN_SESSION_TIMEOUT) {
      // Session expired, remove it from both storages
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return false;
    }

    // Session is valid, update timestamp in both storages
    session.timestamp = now;
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));

    return true;
  } catch (error) {
    console.error('Error refreshing admin session:', error);
    return false;
  }
}

/**
 * Gets the remaining time in the current admin session
 * @returns The remaining time in milliseconds, or 0 if no session exists
 */
export function getAdminSessionTimeRemaining(): number {
  try {
    // Check both sessionStorage and localStorage for admin session
    let sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);

    // If not in sessionStorage, try localStorage
    if (!sessionData) {
      sessionData = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

      // If not in localStorage either, return 0
      if (!sessionData) return 0;
    }

    // Parse the session
    const session: AdminSession = JSON.parse(sessionData);

    // Calculate remaining time
    const now = Date.now();
    const elapsed = now - session.timestamp;
    const remaining = Math.max(0, ADMIN_SESSION_TIMEOUT - elapsed);

    return remaining;
  } catch (error) {
    console.error('Error getting admin session time remaining:', error);
    return 0;
  }
}
