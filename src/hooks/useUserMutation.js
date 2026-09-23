import { useAction, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Convex functions declared with userMutation/userAction on the server require
 * proof that the caller owns `args.userId`. These hooks attach this device's
 * session token automatically, so call sites keep passing `{ userId, ... }`.
 */
function withSession(args, sessionToken) {
  if (!sessionToken || !args || typeof args !== 'object' || !('userId' in args)) return args;
  return { ...args, sessionToken };
}

export function useUserMutation(ref) {
  const mutate = useMutation(ref);
  const { sessionToken } = useAuth();
  return useCallback((args) => mutate(withSession(args, sessionToken)), [mutate, sessionToken]);
}

export function useUserAction(ref) {
  const run = useAction(ref);
  const { sessionToken } = useAuth();
  return useCallback((args) => run(withSession(args, sessionToken)), [run, sessionToken]);
}
