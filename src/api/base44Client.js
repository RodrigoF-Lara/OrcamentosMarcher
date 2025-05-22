//import { createClient } from '@base44/sdk';

// Cria o client usando a apiKey, sem exigir autenticação Google
//export const base44 = createClient({
//  appId: "681abf384445610e1ee1321d",
//  apiKey: "8bf42bfb317049f3a8489e618f230df9"
//});

import { createClient } from '@base44/sdk';

// Cria o client exigindo autenticação Google
export const base44 = createClient({
  appId: "681abf384445610e1ee1321d"
  // Não inclua apiKey aqui!
});