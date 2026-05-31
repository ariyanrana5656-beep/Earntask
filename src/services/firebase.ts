import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Safe variables
let appInstance: any = null;
let dbInstance: any = null;
let authInstance: any = null;
let googleProviderInstance: any = null;
let isFirebaseAvailable = false;

try {
  // Check if firebase configuration is valid and complete
  if (firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey) {
    appInstance = initializeApp(firebaseConfig);
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
    authInstance = getAuth(appInstance);
    googleProviderInstance = new GoogleAuthProvider();
    isFirebaseAvailable = true;
    console.log("Firebase initialized successfully inside Vercel/production.");
  } else {
    console.warn("Firebase configuration is incomplete or missing. Falling back to local simulation mode.");
  }
} catch (e) {
  console.error("Firebase failed to initialize on startup:", e);
}

// Ensure exports always exist and are safe to avoid fatal module crashes in the bundle
export { appInstance as app };

export const auth = isFirebaseAvailable ? authInstance : {
  currentUser: null,
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Return empty unsubscribe function
    return () => {};
  },
  signOut: async () => {},
};

export const googleProvider = isFirebaseAvailable ? googleProviderInstance : {};

export const db = isFirebaseAvailable ? dbInstance : null;
export const firestore = db; // Alias to prevent local DB variable shadowing in store.ts

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error/Blocked: ', JSON.stringify(errInfo));
  return null;
}

