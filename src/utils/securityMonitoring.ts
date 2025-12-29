/**
 * Security Monitoring Utilities
 * 
 * This module provides functions for monitoring security-related events
 * and detecting potential security threats.
 */

import { supabase } from '../lib/supabaseClient';
import { handleError, ErrorCategory, ErrorSeverity } from './errorHandling';

// Define security event types
export enum SecurityEventType {
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_FAILURE = 'authorization_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CSRF_ATTACK_ATTEMPT = 'csrf_attack_attempt',
  XSS_ATTACK_ATTEMPT = 'xss_attack_attempt',
  ADMIN_ACCESS = 'admin_access',
  PASSWORD_CHANGE = 'password_change',
  PROFILE_UPDATE = 'profile_update'
}

// Security event interface
export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: string;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

// Maximum number of events to store locally
const MAX_LOCAL_EVENTS = 100;

// Local storage key for security events
const SECURITY_EVENTS_KEY = 'security_events';

/**
 * Logs a security event
 * 
 * @param type The type of security event
 * @param details Additional details about the event
 * @param userId The ID of the user involved (if any)
 * @param email The email of the user involved (if any)
 */
export async function logSecurityEvent(
  type: SecurityEventType,
  details?: any,
  userId?: string,
  email?: string
): Promise<void> {
  try {
    // Get current user if not provided
    if (!userId || !email) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = userId || user.id;
        email = email || user.email;
      }
    }
    
    // Create the security event
    const event: SecurityEvent = {
      type,
      timestamp: new Date().toISOString(),
      userId,
      email,
      ipAddress: 'client-side', // We can't get the real IP on the client side
      userAgent: navigator.userAgent,
      details
    };
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.info(`[SECURITY EVENT] ${type}:`, event);
    }
    
    // Store locally
    storeSecurityEventLocally(event);
    
    // In production, send to server
    if (import.meta.env.PROD) {
      // This would be implemented with a server-side endpoint
      // For now, we'll just log to Supabase Edge Function if available
      try {
        await supabase.functions.invoke('log-security-event', {
          method: 'POST',
          body: { event }
        });
      } catch (error) {
        // Silently fail if the function doesn't exist
        console.warn('Could not send security event to server:', error);
      }
    }
  } catch (error) {
    // Use our error handling utility
    handleError(
      error instanceof Error ? error : new Error(String(error)),
      'Failed to log security event',
      ErrorCategory.UNKNOWN,
      ErrorSeverity.WARNING
    );
  }
}

/**
 * Stores a security event locally
 * 
 * @param event The security event to store
 */
function storeSecurityEventLocally(event: SecurityEvent): void {
  try {
    // Get existing events
    const eventsJson = localStorage.getItem(SECURITY_EVENTS_KEY);
    const events: SecurityEvent[] = eventsJson ? JSON.parse(eventsJson) : [];
    
    // Add the new event
    events.push(event);
    
    // Limit the number of events
    if (events.length > MAX_LOCAL_EVENTS) {
      events.splice(0, events.length - MAX_LOCAL_EVENTS);
    }
    
    // Store the updated events
    localStorage.setItem(SECURITY_EVENTS_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn('Failed to store security event locally:', error);
  }
}

/**
 * Gets all locally stored security events
 * 
 * @returns An array of security events
 */
export function getLocalSecurityEvents(): SecurityEvent[] {
  try {
    const eventsJson = localStorage.getItem(SECURITY_EVENTS_KEY);
    return eventsJson ? JSON.parse(eventsJson) : [];
  } catch (error) {
    console.warn('Failed to get local security events:', error);
    return [];
  }
}

/**
 * Clears all locally stored security events
 */
export function clearLocalSecurityEvents(): void {
  localStorage.removeItem(SECURITY_EVENTS_KEY);
}

/**
 * Detects suspicious activity based on security events
 * 
 * @returns True if suspicious activity is detected, false otherwise
 */
export function detectSuspiciousActivity(): boolean {
  try {
    const events = getLocalSecurityEvents();
    
    // Check for multiple authentication failures
    const recentAuthFailures = events.filter(event => 
      event.type === SecurityEventType.AUTHENTICATION_FAILURE &&
      new Date(event.timestamp).getTime() > Date.now() - 30 * 60 * 1000 // Last 30 minutes
    );
    
    if (recentAuthFailures.length >= 5) {
      return true;
    }
    
    // Check for multiple rate limit exceeded events
    const recentRateLimitEvents = events.filter(event => 
      event.type === SecurityEventType.RATE_LIMIT_EXCEEDED &&
      new Date(event.timestamp).getTime() > Date.now() - 60 * 60 * 1000 // Last hour
    );
    
    if (recentRateLimitEvents.length >= 3) {
      return true;
    }
    
    // Check for CSRF or XSS attack attempts
    const recentAttackAttempts = events.filter(event => 
      (event.type === SecurityEventType.CSRF_ATTACK_ATTEMPT || 
       event.type === SecurityEventType.XSS_ATTACK_ATTEMPT) &&
      new Date(event.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    if (recentAttackAttempts.length >= 1) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to detect suspicious activity:', error);
    return false;
  }
}
