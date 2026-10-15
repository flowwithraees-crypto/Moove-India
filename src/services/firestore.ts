import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';
import { 
  PlaceDocument, 
  HitchhikingSpot, 
  Report, 
  Journey, 
  TravellerPost, 
  SavedTrip,
  NotificationItem,
  UserProfile,
  UserPrivateData,
  ModerationStatus 
} from '../types';
import { INITIAL_PLACES, INITIAL_HITCHHIKING_SPOTS, INITIAL_POSTS, SAMPLE_SAVED_JOURNEYS } from '../data/mockData';

// Structured Firestore error handling compliant with Firebase Skill guidelines
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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth ? auth.currentUser : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Security/Operation Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Local storage cache keys
const STORAGE_KEYS = {
  PLACES: 'roamlite_places_v2',
  HITCH_SPOTS: 'roamlite_hitch_spots_v2',
  REPORTS: 'roamlite_reports_v2',
  JOURNEYS: 'roamlite_journeys_v2',
  POSTS: 'roamlite_posts_v2',
  SAVED_TRIPS: 'roamlite_saved_trips_v2',
  NOTIFICATIONS: 'roamlite_notifications_v2',
};

const getStoredData = <T>(key: string, defaultData: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
};

const setStoredData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Local cache storage error:', err);
  }
};

// Check whether a user is registered as an Admin in Firestore
export const checkIfUserIsAdmin = async (uid: string): Promise<boolean> => {
  if (isFirebaseConfigured() && db) {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', uid));
      return adminDoc.exists();
    } catch {
      return false;
    }
  }
  return false;
};

// ======================== 1. PLACES ========================
export const getPlaces = async (filters?: {
  status?: ModerationStatus;
  city?: string;
  type?: string;
}): Promise<PlaceDocument[]> => {
  if (isFirebaseConfigured() && db) {
    const path = 'places';
    try {
      const placesCol = collection(db, path);
      // Query approved places
      const q = query(placesCol, where('status', '==', filters?.status || 'approved'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PlaceDocument, 'id'>) }));
      }
    } catch (err) {
      console.warn('Firestore places fetch fallback to local store:', err);
    }
  }

  let list = getStoredData<PlaceDocument>(STORAGE_KEYS.PLACES, INITIAL_PLACES);
  if (filters?.status) {
    list = list.filter(p => p.status === filters.status);
  } else {
    list = list.filter(p => p.status === 'approved');
  }
  if (filters?.city) {
    list = list.filter(p => p.city.toLowerCase().includes(filters.city!.toLowerCase()));
  }
  if (filters?.type && filters.type !== 'all') {
    list = list.filter(p => p.type === filters.type);
  }
  return list;
};

export const getAllPlacesForAdmin = async (): Promise<PlaceDocument[]> => {
  if (isFirebaseConfigured() && db) {
    const path = 'places';
    try {
      const snapshot = await getDocs(collection(db, path));
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PlaceDocument, 'id'>) }));
      }
    } catch (e) {
      console.warn('Admin places fallback:', e);
    }
  }
  return getStoredData<PlaceDocument>(STORAGE_KEYS.PLACES, INITIAL_PLACES);
};

export const addPlace = async (
  place: Omit<PlaceDocument, 'id' | 'createdAt' | 'updatedAt' | 'reportCount' | 'verified' | 'status'>
): Promise<PlaceDocument> => {
  const newId = 'place_' + Date.now().toString(36);
  const path = `places/${newId}`;

  const placeData = {
    ...place,
    reportCount: 1,
    verified: false,
    status: 'pending' as ModerationStatus, // Mandatory pending moderation for safety
    createdAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
    updatedAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'places', newId), placeData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  const localPlace: PlaceDocument = {
    ...place,
    id: newId,
    reportCount: 1,
    verified: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = getStoredData<PlaceDocument>(STORAGE_KEYS.PLACES, INITIAL_PLACES);
  setStoredData(STORAGE_KEYS.PLACES, [localPlace, ...existing]);
  return localPlace;
};

export const updatePlaceStatus = async (
  id: string,
  status: ModerationStatus,
  verified = false
): Promise<void> => {
  const path = `places/${id}`;
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'places', id), {
        status,
        verified,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  const list = getStoredData<PlaceDocument>(STORAGE_KEYS.PLACES, INITIAL_PLACES);
  const updated = list.map(p =>
    p.id === id ? { ...p, status, verified, updatedAt: new Date().toISOString() } : p
  );
  setStoredData(STORAGE_KEYS.PLACES, updated);
};

export const getPlacesInBounds = async (bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<PlaceDocument[]> => {
  const allPlaces = await getPlaces();
  return allPlaces.filter(
    (p) =>
      p.location.lat >= bounds.south &&
      p.location.lat <= bounds.north &&
      p.location.lng >= bounds.west &&
      p.location.lng <= bounds.east
  );
};

// ======================== 2. HITCHHIKING SPOTS ========================
export const getHitchhikingSpots = async (filters?: {
  status?: ModerationStatus;
  difficulty?: string;
}): Promise<HitchhikingSpot[]> => {
  if (isFirebaseConfigured() && db) {
    const path = 'hitchhikingSpots';
    try {
      const spotsCol = collection(db, path);
      const q = query(spotsCol, where('status', '==', filters?.status || 'approved'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<HitchhikingSpot, 'id'>) }));
      }
    } catch (err) {
      console.warn('Firestore hitch spots fetch fallback:', err);
    }
  }

  let list = getStoredData<HitchhikingSpot>(STORAGE_KEYS.HITCH_SPOTS, INITIAL_HITCHHIKING_SPOTS);
  if (filters?.status) {
    list = list.filter(s => s.status === filters.status);
  } else {
    list = list.filter(s => s.status === 'approved');
  }
  if (filters?.difficulty && filters.difficulty !== 'all') {
    list = list.filter(s => s.difficulty === filters.difficulty);
  }
  return list;
};

export const getAllHitchhikingSpotsForAdmin = async (): Promise<HitchhikingSpot[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snapshot = await getDocs(collection(db, 'hitchhikingSpots'));
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<HitchhikingSpot, 'id'>) }));
      }
    } catch (e) {
      console.warn('Admin hitch spots fallback:', e);
    }
  }
  return getStoredData<HitchhikingSpot>(STORAGE_KEYS.HITCH_SPOTS, INITIAL_HITCHHIKING_SPOTS);
};

export const addHitchhikingSpot = async (
  spot: Omit<HitchhikingSpot, 'id' | 'reportCount' | 'lastVerifiedAt' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<HitchhikingSpot> => {
  const newId = 'hitch_' + Date.now().toString(36);
  const path = `hitchhikingSpots/${newId}`;

  const spotData = {
    ...spot,
    reportCount: 1,
    status: 'pending' as ModerationStatus,
    lastVerifiedAt: new Date().toISOString(),
    createdAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
    updatedAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'hitchhikingSpots', newId), spotData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  const localSpot: HitchhikingSpot = {
    ...spot,
    id: newId,
    reportCount: 1,
    status: 'pending',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = getStoredData<HitchhikingSpot>(STORAGE_KEYS.HITCH_SPOTS, INITIAL_HITCHHIKING_SPOTS);
  setStoredData(STORAGE_KEYS.HITCH_SPOTS, [localSpot, ...existing]);
  return localSpot;
};

export const updateHitchhikingSpotStatus = async (
  id: string,
  status: ModerationStatus
): Promise<void> => {
  const path = `hitchhikingSpots/${id}`;
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'hitchhikingSpots', id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  const list = getStoredData<HitchhikingSpot>(STORAGE_KEYS.HITCH_SPOTS, INITIAL_HITCHHIKING_SPOTS);
  const updated = list.map(s => (s.id === id ? { ...s, status } : s));
  setStoredData(STORAGE_KEYS.HITCH_SPOTS, updated);
};

export const getHitchhikingSpotsInBounds = async (bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<HitchhikingSpot[]> => {
  const allSpots = await getHitchhikingSpots();
  return allSpots.filter(
    (s) =>
      s.location.lat >= bounds.south &&
      s.location.lat <= bounds.north &&
      s.location.lng >= bounds.west &&
      s.location.lng <= bounds.east
  );
};

// ======================== 3. REPORTS ========================
export const getReports = async (targetId?: string): Promise<Report[]> => {
  if (isFirebaseConfigured() && db) {
    const path = 'reports';
    try {
      const reportsCol = collection(db, path);
      let q = query(reportsCol, where('status', '==', 'approved'), limit(50));
      if (targetId) {
        q = query(reportsCol, where('targetId', '==', targetId), where('status', '==', 'approved'));
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Report, 'id'>) }));
      }
    } catch (err) {
      console.warn('Firestore reports fetch fallback:', err);
    }
  }

  let list = getStoredData<Report>(STORAGE_KEYS.REPORTS, []);
  if (targetId) {
    list = list.filter(r => r.targetId === targetId);
  }
  return list;
};

export const addReport = async (
  report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'createdBy'>
): Promise<Report> => {
  const newId = 'rep_' + Date.now().toString(36);
  const path = `reports/${newId}`;

  const reportData = {
    ...report,
    createdBy: report.userId,
    status: 'approved' as ModerationStatus,
    createdAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
    updatedAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'reports', newId), reportData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  const localReport: Report = {
    ...report,
    id: newId,
    createdBy: report.userId,
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = getStoredData<Report>(STORAGE_KEYS.REPORTS, []);
  setStoredData(STORAGE_KEYS.REPORTS, [localReport, ...existing]);
  return localReport;
};

// ======================== 4. JOURNEYS ========================
export const saveJourneyToStore = async (journey: Journey): Promise<void> => {
  const path = `journeys/${journey.id}`;
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'journeys', journey.id), {
        ...journey,
        createdAt: isFirebaseConfigured() ? serverTimestamp() : journey.createdAt,
        updatedAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  const existing = getStoredData<Journey>(STORAGE_KEYS.JOURNEYS, SAMPLE_SAVED_JOURNEYS);
  const filtered = existing.filter(j => j.id !== journey.id);
  setStoredData(STORAGE_KEYS.JOURNEYS, [journey, ...filtered]);
};

// ======================== 5. SAVED TRIPS ========================
export const getSavedTrips = (userId: string): SavedTrip[] => {
  const defaultTrips: SavedTrip[] = [
    {
      id: 'st-1',
      userId,
      journeyId: SAMPLE_SAVED_JOURNEYS[0].id,
      journey: SAMPLE_SAVED_JOURNEYS[0],
      customNotes: 'Planned for May summer expedition with tent & hitchhiking card.',
      createdBy: userId,
      savedAt: '2026-03-22T10:00:00Z',
      createdAt: '2026-03-22T10:00:00Z',
      updatedAt: '2026-03-22T10:00:00Z',
    }
  ];
  const stored = getStoredData<SavedTrip>(STORAGE_KEYS.SAVED_TRIPS, defaultTrips);
  return stored.filter(s => s.userId === userId || s.userId === 'guest' || userId === 'all');
};

export const toggleSaveTrip = (userId: string, journey: Journey): boolean => {
  const all = getStoredData<SavedTrip>(STORAGE_KEYS.SAVED_TRIPS, []);
  const existingIndex = all.findIndex(t => t.journeyId === journey.id && t.userId === userId);

  if (existingIndex >= 0) {
    const tripToRemove = all[existingIndex];
    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, 'savedTrips', tripToRemove.id)).catch(() => {});
    }
    all.splice(existingIndex, 1);
    setStoredData(STORAGE_KEYS.SAVED_TRIPS, all);
    return false; // un-saved
  } else {
    const newSave: SavedTrip = {
      id: 'save_' + Date.now().toString(36),
      userId,
      journeyId: journey.id,
      journey,
      createdBy: userId,
      savedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, 'savedTrips', newSave.id), {
        ...newSave,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }

    all.unshift(newSave);
    setStoredData(STORAGE_KEYS.SAVED_TRIPS, all);
    return true; // saved
  }
};

export const isTripSaved = (userId: string, journeyId: string): boolean => {
  const all = getStoredData<SavedTrip>(STORAGE_KEYS.SAVED_TRIPS, []);
  return all.some(t => t.journeyId === journeyId && (t.userId === userId || t.userId === 'guest'));
};

// ======================== 6. TRAVELLER POSTS ========================
export const getTravellerPosts = async (): Promise<TravellerPost[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const postsCol = collection(db, 'travellerPosts');
      const q = query(postsCol, orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<TravellerPost, 'id'>) }));
      }
    } catch {
      // fallback
    }
  }
  return getStoredData<TravellerPost>(STORAGE_KEYS.POSTS, INITIAL_POSTS as any);
};

export const addTravellerPost = async (
  post: Omit<TravellerPost, 'id' | 'createdAt' | 'updatedAt' | 'likes'>
): Promise<TravellerPost> => {
  const newId = 'post_' + Date.now().toString(36);
  const path = `travellerPosts/${newId}`;

  const postData = {
    ...post,
    likes: 0,
    createdAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
    updatedAt: isFirebaseConfigured() ? serverTimestamp() : new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'travellerPosts', newId), postData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  const localPost: TravellerPost = {
    ...post,
    id: newId,
    likes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const list = getStoredData<TravellerPost>(STORAGE_KEYS.POSTS, INITIAL_POSTS as any);
  setStoredData(STORAGE_KEYS.POSTS, [localPost, ...list]);
  return localPost;
};

// ======================== 7. NOTIFICATIONS ========================
export const getNotifications = async (userId: string): Promise<NotificationItem[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const notifCol = collection(db, 'notifications');
      const q = query(notifCol, where('userId', '==', userId), limit(30));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) }));
      }
    } catch {
      // fallback
    }
  }
  return getStoredData<NotificationItem>(STORAGE_KEYS.NOTIFICATIONS, []);
};

export const markNotificationRead = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // fallback
    }
  }

  const list = getStoredData<NotificationItem>(STORAGE_KEYS.NOTIFICATIONS, []);
  setStoredData(
    STORAGE_KEYS.NOTIFICATIONS,
    list.map(n => (n.id === id ? { ...n, read: true } : n))
  );
};

// ======================== 8. ADMIN MANAGEMENT OPERATIONS ========================
export const deletePlace = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'places', id));
    } catch (e) {
      console.warn('Delete place note:', e);
    }
  }
  const list = getStoredData<PlaceDocument>(STORAGE_KEYS.PLACES, INITIAL_PLACES);
  setStoredData(STORAGE_KEYS.PLACES, list.filter(p => p.id !== id));
};

export const deleteHitchhikingSpot = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'hitchhikingSpots', id));
    } catch (e) {
      console.warn('Delete spot note:', e);
    }
  }
  const list = getStoredData<HitchhikingSpot>(STORAGE_KEYS.HITCH_SPOTS, INITIAL_HITCHHIKING_SPOTS);
  setStoredData(STORAGE_KEYS.HITCH_SPOTS, list.filter(s => s.id !== id));
};

export const updatePlaceData = async (id: string, updates: Partial<PlaceDocument>): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'places', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Update place note:', e);
    }
  }
  const list = getStoredData<PlaceDocument>(STORAGE_KEYS.PLACES, INITIAL_PLACES);
  setStoredData(
    STORAGE_KEYS.PLACES,
    list.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
  );
};

// Admin Users Query
export const getUsersForAdmin = async (): Promise<UserProfile[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      }
    } catch (e) {
      console.warn('Admin users fallback:', e);
    }
  }

  return [
    {
      id: 'usr_admin_1',
      displayName: 'Raees (Admin)',
      email: 'flowwithraees@gmail.com',
      role: 'admin',
      travelKarma: 500,
      badges: ['Super Admin', 'Community Guardian'],
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'usr_nomad_2',
      displayName: 'Kabir Nomad',
      email: 'kabir@moove.in',
      role: 'user',
      travelKarma: 180,
      badges: ['Highway Veteran', 'Langar Regular'],
      createdAt: '2026-02-15T10:00:00Z'
    },
    {
      id: 'usr_nomad_3',
      displayName: 'Maya Backpacker',
      email: 'maya@moove.in',
      role: 'user',
      travelKarma: 95,
      badges: ['Verified Nomad'],
      createdAt: '2026-03-01T12:00:00Z'
    }
  ];
};

