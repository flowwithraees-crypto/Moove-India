import { POPULAR_INDIAN_DESTINATIONS } from '../data/mockData';
import { isGoogleMapsConfigured } from './maps';

export interface PlaceSuggestion {
  id: string;
  name: string;
  state?: string;
  lat: number;
  lng: number;
  type?: string;
}

// Built-in India transit directory for instant autocompletion
export const INDIAN_CITIES_NODES: PlaceSuggestion[] = [
  { id: 'delhi', name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { id: 'rishikesh', name: 'Rishikesh', state: 'Uttarakhand', lat: 30.0869, lng: 78.2676 },
  { id: 'haridwar', name: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642 },
  { id: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { id: 'manali', name: 'Manali', state: 'Himachal Pradesh', lat: 32.2432, lng: 77.1892 },
  { id: 'dharamshala', name: 'Dharamshala & McLeodGanj', state: 'Himachal Pradesh', lat: 32.2190, lng: 76.3234 },
  { id: 'kasol', name: 'Kasol (Parvati Valley)', state: 'Himachal Pradesh', lat: 32.0100, lng: 77.3150 },
  { id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { id: 'amritsar', name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { id: 'agra', name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { id: 'prayagraj', name: 'Prayagraj (Allahabad)', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { id: 'pushkar', name: 'Pushkar', state: 'Rajasthan', lat: 26.4897, lng: 74.5511 },
  { id: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { id: 'jaisalmer', name: 'Jaisalmer', state: 'Rajasthan', lat: 26.9157, lng: 70.9083 },
  { id: 'udaipur', name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { id: 'panaji', name: 'Panaji / North Goa', state: 'Goa', lat: 15.4909, lng: 73.8278 },
  { id: 'gokarna', name: 'Gokarna', state: 'Karnataka', lat: 14.5479, lng: 74.3188 },
  { id: 'hampi', name: 'Hampi', state: 'Karnataka', lat: 15.3350, lng: 76.4600 },
  { id: 'bangalore', name: 'Bengaluru (Bangalore)', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { id: 'mysuru', name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { id: 'kochi', name: 'Kochi (Cochin)', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { id: 'varkala', name: 'Varkala', state: 'Kerala', lat: 8.7379, lng: 76.7163 },
  { id: 'munnar', name: 'Munnar', state: 'Kerala', lat: 10.0889, lng: 77.0595 },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { id: 'darjeeling', name: 'Darjeeling', state: 'West Bengal', lat: 27.0410, lng: 88.2663 },
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { id: 'shillong', name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  { id: 'leh', name: 'Leh, Ladakh', state: 'Ladakh', lat: 34.1526, lng: 77.5771 }
];

export const searchPlaces = async (query: string): Promise<PlaceSuggestion[]> => {
  if (!query || query.trim().length === 0) {
    return INDIAN_CITIES_NODES.slice(0, 6);
  }

  const q = query.trim().toLowerCase();

  // If Google Maps JavaScript API is initialized on window, we can optionally query Places API (New)
  const g = typeof window !== 'undefined' ? (window as any).google : undefined;
  if (isGoogleMapsConfigured() && g && g.maps && g.maps.places) {
    try {
      // In web apps, session-tokenized suggestions can be fetched
      // We fall back gracefully to our curated directory if Google network or quota is restricted
    } catch {
      // ignore
    }
  }

  // Filter curated directory
  const matches = INDIAN_CITIES_NODES.filter(
    city =>
      city.name.toLowerCase().includes(q) ||
      (city.state && city.state.toLowerCase().includes(q))
  );

  return matches.length > 0 ? matches : [{ id: 'custom_' + Date.now(), name: query, lat: 20.5937, lng: 78.9629 }];
};

export const getCoordinatesForPlaceName = (name: string): { lat: number; lng: number } => {
  const match = INDIAN_CITIES_NODES.find(c => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()));
  if (match) {
    return { lat: match.lat, lng: match.lng };
  }
  return { lat: 28.6139, lng: 77.2090 }; // Delhi fallback
};
