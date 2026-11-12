/** Translates raw Supabase, Postgres, and network errors into clean user-facing messages. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return error.trim() || fallback;
  }

  const errObj = error as { message?: string; code?: string; details?: string; hint?: string };
  const raw = (errObj.message || '').trim();
  const code = errObj.code || '';

  if (/network request failed|failed to fetch|networkerror/i.test(raw)) {
    return 'Unable to connect right now. Please check your internet connection and try again.';
  }
  if (/jwt expired|invalid jwt|refresh_token_not_found|session.*missing|not authenticated/i.test(raw)) {
    return 'Your session has expired. Please sign in again.';
  }
  if (/invalid login credentials/i.test(raw)) {
    return 'Incorrect email or password. Please check your credentials.';
  }
  if (/email not confirmed/i.test(raw)) {
    return 'Please verify your email address before signing in.';
  }
  if (/user already registered|already been registered/i.test(raw)) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (code === '42P17' || /infinite recursion detected in policy/i.test(raw)) {
    return 'Database permission policy needs an update. Run the latest Supabase migration in SQL Editor and try again.';
  }
  if (code === '42501' || /row-level security policy/i.test(raw)) {
    return 'You do not have permission for this action. Please sign in again or update your Supabase RLS policies.';
  }
  if (code === '23503') {
    return 'Linked account or profile record is missing. Try refreshing your session or signing in again.';
  }
  if (code === '23505') {
    return 'A duplicate entry already exists. Please use a unique name.';
  }

  return raw || fallback;
}

