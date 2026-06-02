import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore,
  collection as realCollection,
  doc as realDoc,
  getDoc as realGetDoc,
  getDocs as realGetDocs,
  setDoc as realSetDoc,
  updateDoc as realUpdateDoc,
  deleteDoc as realDeleteDoc,
  writeBatch as realWriteBatch,
  onSnapshot as realOnSnapshot
} from 'firebase/firestore';
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

// Guarded / Fallback implementations of Firestore methods
export const collection = (dbRef: any, ...args: any[]) => {
  if (isFirebaseAvailable && dbRef) {
    return (realCollection as any)(dbRef, ...args);
  }
  return { id: args[0] || 'dummy-col', path: args[0] || 'dummy-col' } as any;
};

export const doc = (dbRef: any, ...args: any[]) => {
  if (isFirebaseAvailable && dbRef) {
    return (realDoc as any)(dbRef, ...args);
  }
  return { id: args[1] || 'dummy-doc', path: args.join('/') } as any;
};

export const getDoc = async (docRef: any) => {
  if (isFirebaseAvailable && docRef && docRef.path && !docRef.path.includes('dummy')) {
    try {
      return await realGetDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docRef?.path);
      return {
        exists: () => false,
        data: () => null,
        id: docRef?.id || 'dummy-doc',
      } as any;
    }
  }
  return {
    exists: () => false,
    data: () => null,
    id: docRef?.id || 'dummy-doc',
  } as any;
};

export const getDocs = async (colRef: any) => {
  if (isFirebaseAvailable && colRef && colRef.path && !colRef.path.includes('dummy')) {
    try {
      return await realGetDocs(colRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colRef?.path);
      return {
        empty: true,
        size: 0,
        docs: [],
        forEach: () => {},
      } as any;
    }
  }
  return {
    empty: true,
    size: 0,
    docs: [],
    forEach: () => {},
  } as any;
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  if (isFirebaseAvailable && docRef && docRef.path && !docRef.path.includes('dummy')) {
    try {
      return await realSetDoc(docRef, data, options);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docRef?.path);
      return Promise.resolve();
    }
  }
  return Promise.resolve();
};

export const updateDoc = async (docRef: any, data: any) => {
  if (isFirebaseAvailable && docRef && docRef.path && !docRef.path.includes('dummy')) {
    try {
      return await realUpdateDoc(docRef, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docRef?.path);
      return Promise.resolve();
    }
  }
  return Promise.resolve();
};

export const deleteDoc = async (docRef: any) => {
  if (isFirebaseAvailable && docRef && docRef.path && !docRef.path.includes('dummy')) {
    try {
      return await realDeleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docRef?.path);
      return Promise.resolve();
    }
  }
  return Promise.resolve();
};

export const writeBatch = (dbRef: any) => {
  if (isFirebaseAvailable && dbRef) {
    try {
      const batchObj = realWriteBatch(dbRef);
      const originalCommit = batchObj.commit.bind(batchObj);
      batchObj.commit = async () => {
        try {
          return await originalCommit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'writeBatchCommitFallback');
          return Promise.resolve();
        }
      };
      return batchObj;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'writeBatchInitError');
    }
  }
  const dummyBatch = {
    set: () => dummyBatch,
    update: () => dummyBatch,
    delete: () => dummyBatch,
    commit: async () => Promise.resolve(),
  };
  return dummyBatch as any;
};

export const onSnapshot = (docRef: any, callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => {
  if (isFirebaseAvailable && docRef && docRef.path && !docRef.path.includes('dummy')) {
    try {
      return realOnSnapshot(
        docRef,
        callback,
        (err) => {
          handleFirestoreError(err, OperationType.GET, `onSnapshot/${docRef?.path}`);
          if (errorCallback) {
            errorCallback(err);
          }
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `onSnapshotRegister/${docRef?.path}`);
      return () => {};
    }
  }
  return () => {};
};

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

