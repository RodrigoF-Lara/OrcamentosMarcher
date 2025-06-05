import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "681abf384445610e1ee1321d", 
  requiresAuth: false // Ensure authentication is required for all operations
});
