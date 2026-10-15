import type { Timestamp, FieldValue } from 'firebase/firestore';

export type PlaceType = 
  | 'food' 
  | 'stay' 
  | 'water' 
  | 'camping' 
  | 'shower' 
  | 'charging';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type TravelStyle = 'Cheapest' | 'Balanced' | 'Adventure';

export type HitchhikingDifficulty = 'Easy' | 'Moderate' | 'Challenging';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  landmark?: string;
}

// Public User profile (safe for other nomads to view)
export interface UserProfile {
  id: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  role: 'user' | 'admin';
  travelKarma: number;
  badges: string[];
  createdAt: string | Timestamp | FieldValue;
  updatedAt?: string | Timestamp | FieldValue;
  email?: string;
}

// Private User data (only accessible to the owner or admin)
export interface UserPrivateData {
  userId: string;
  email: string;
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  updatedAt: string | Timestamp | FieldValue;
}

// 1. PLACE DOCUMENT
export interface PlaceDocument {
  id: string;
  name: string;
  type: PlaceType;
  description: string;
  location: GeoLocation;
  city: string;
  state: string;
  priceMin: number; // 0 for free (langar, RO water, ashram)
  priceMax: number;
  rating: number; // 1.0 to 5.0
  reportCount: number;
  verified: boolean;
  createdBy: string;
  creatorName?: string;
  status: ModerationStatus;
  photoUrl?: string;
  tags?: string[];
  timing?: string;
  createdAt: string | Timestamp | FieldValue;
  updatedAt: string | Timestamp | FieldValue;
}

// 2. HITCHHIKING SPOT
export interface HitchhikingSpot {
  id: string;
  name: string;
  location: GeoLocation;
  roadName: string; // e.g. "NH44 (Delhi-Ambala Highway)"
  direction: string; // e.g. "Northbound towards Chandigarh/Manali"
  difficulty: HitchhikingDifficulty;
  averageWaitMinutes: number; // e.g. 20
  bestTime: string; // e.g. "06:00 AM - 10:00 AM"
  safetyRating: number; // 1 to 5 community confidence
  reportCount: number;
  lastVerifiedAt: string;
  createdBy: string;
  creatorName?: string;
  status: ModerationStatus;
  photoUrl?: string;
  vehicleTypes?: string[]; // e.g. Trucks, Private Cars, Tempos
  notes?: string;
  createdAt?: string | Timestamp | FieldValue;
  updatedAt?: string | Timestamp | FieldValue;
}

// 3. REPORT DOCUMENT
export interface Report {
  id: string;
  userId: string;
  userName?: string;
  targetType: 'place' | 'hitchhikingSpot';
  targetId: string;
  rating: number;
  comment: string;
  pricePaid?: number;
  visitedAt: string;
  createdBy: string;
  createdAt: string | Timestamp | FieldValue;
  updatedAt?: string | Timestamp | FieldValue;
  status: ModerationStatus;
  safetyIssueReported?: boolean;
}

// 4. JOURNEY DOCUMENT
export interface JourneyStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  day: number;
  highlights: string[];
  staySuggestion: string;
  foodSuggestion: string;
  transitTip: string;
  approxDailyCost: number;
  recommendedPlaceIds?: string[];
}

export interface Journey {
  id: string;
  from: string;
  to: string;
  budget: number;
  days: number;
  travelStyle: TravelStyle;
  estimatedTransportCost: number;
  estimatedFoodCost: number;
  estimatedAccommodationCost: number;
  emergencyBudget: number;
  totalEstimatedCost: number;
  dailyAverage: number;
  suggestedStops: JourneyStop[];
  routeSegments?: RouteSegment[];
  recommendations?: JourneyRecommendation[];
  summary?: string;
  routePolyline?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string | Timestamp | FieldValue;
  updatedAt?: string | Timestamp | FieldValue;
}

// 4b. GEMINI INTELLIGENCE TYPES
export type InformationType = 'VERIFIED_COMMUNITY' | 'ESTIMATED' | 'AI_SUGGESTION';

export interface RouteSegment {
  from: string;
  to: string;
  distanceKm?: number;
  recommendedMode: string;
  estimatedCost: number;
  tips: string;
  informationType: InformationType;
}

export interface JourneyRecommendation {
  placeId?: string; // Must reference actual place ID if coming from Firestore
  title: string;
  category: 'stay' | 'food' | 'water' | 'hitchhiking' | 'camping' | 'transport' | 'safety';
  description: string;
  cost: number;
  informationType: InformationType;
  sourceName?: string;
}

export interface BudgetJourneyResult {
  summary: string;
  routeSegments: RouteSegment[];
  estimatedTransportCost: number;
  estimatedFoodCost: number;
  estimatedStayCost: number;
  emergencyBudget: number;
  totalEstimatedCost: number;
  dailyAverage: number;
  recommendations: JourneyRecommendation[];
}

export interface BudgetOptimizationResult {
  summary: string;
  targetBudget: number;
  originalCost: number;
  savingsTotal: number;
  adjustedBreakdown: {
    estimatedTransportCost: number;
    estimatedFoodCost: number;
    estimatedAccommodationCost: number;
    estimatedStayCost?: number;
    emergencyBudget: number;
    totalEstimatedCost: number;
    dailyAverage: number;
  };
  recommendations: Array<{
    action: string;
    potentialSavings: number;
    category: 'transport' | 'food' | 'stay' | 'gear';
    details: string;
    placeId?: string;
    informationType: InformationType;
  }>;
  savingsTips: string[];
}

export interface TravelAssistantResult {
  reply: string;
  referencedPlaces: Array<{
    placeId: string;
    name: string;
    city: string;
    type: string;
    price: string;
    informationType?: InformationType;
  }>;
  safetyAlerts: string[];
  informationType: InformationType;
}

export interface ModerationResult {
  classification: 'approved' | 'needs_review' | 'rejected';
  approved: boolean;
  confidence: number;
  reason: string;
  flags: string[];
  suggestedEdits?: string;
}

// 5. TRAVELLER POST
export interface TravellerPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  route: string;
  costPerDay: number;
  likes: number;
  tips: string[];
  photoUrl?: string;
  createdBy?: string;
  createdAt: string | Timestamp | FieldValue;
  updatedAt?: string | Timestamp | FieldValue;
}

// 6. SAVED TRIP
export interface SavedTrip {
  id: string;
  userId: string;
  journeyId: string;
  journey: Journey;
  customNotes?: string;
  createdBy: string;
  savedAt: string | Timestamp | FieldValue;
  createdAt: string | Timestamp | FieldValue;
  updatedAt: string | Timestamp | FieldValue;
}

// 7. NOTIFICATION
export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'safety' | 'verification' | 'karma';
  read: boolean;
  createdBy: string;
  createdAt: string | Timestamp | FieldValue;
  updatedAt?: string | Timestamp | FieldValue;
}

// 8. ADMIN RECORD
export interface AdminRecord {
  uid: string;
  email: string;
  grantedAt: string | Timestamp | FieldValue;
  grantedBy: string;
}

export interface FilterOptions {
  searchQuery: string;
  selectedCategories: (PlaceType | 'hitchhiking')[];
  maxPrice: number;
  freeOnly: boolean;
  verifiedOnly: boolean;
  state?: string;
}

// 9. CURATED DESTINATION (CMS)
export interface CuratedDestination {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  budgetPerDay: number;
  season: string;
  description: string;
  tags: string[];
  image: string;
  tagBadge?: string;
  highlights?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
  lastUpdated?: string;
}

// 10. REVIEWS
export interface ReviewItem {
  id: string;
  targetId: string;
  targetType: 'place' | 'hitchhikingSpot' | 'destination';
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  photos?: string[];
  likes?: number;
  status?: ModerationStatus;
  createdAt: string;
  updatedAt?: string;
}

// 11. BANNERS
export interface BannerItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  ctaText: string;
  ctaDestination: string;
  startDate?: string;
  endDate?: string;
  isPublished: boolean;
  createdAt?: string;
}

// 12. APP SETTINGS (Admin-Controlled)
export interface AppSettings {
  appName: string;
  currency: string;
  defaultCountry: string;
  registrationEnabled: boolean;
  communitySubmissionsEnabled: boolean;
  aiFeaturesEnabled: boolean;
  maintenanceMode: boolean;
  moderationRequired: boolean;
  hitchhikingSubmissionsEnabled: boolean;
}

