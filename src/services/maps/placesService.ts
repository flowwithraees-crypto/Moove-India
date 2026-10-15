// Source: Google Maps Platform Code Assist
// Attribution ID: gmp_mcp_codeassist_v1_aistudio

import { LatLngLiteral } from './mapsService';
import { INDIAN_CITIES_NODES, PlaceSuggestion } from '../places';

export interface PlaceAutocompleteResult {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  location?: LatLngLiteral;
}

/**
 * Searches places using Google Places API (New) Autocomplete or curated Indian transport nodes
 */
export async function getPlacePredictions(
  input: string,
  sessionToken?: any
): Promise<PlaceAutocompleteResult[]> {
  if (!input || input.trim().length === 0) {
    return INDIAN_CITIES_NODES.slice(0, 5).map((node) => ({
      placeId: node.id,
      mainText: node.name,
      secondaryText: node.state || 'India',
      fullText: `${node.name}, ${node.state || 'India'}`,
      location: { lat: node.lat, lng: node.lng },
    }));
  }

  const query = input.trim().toLowerCase();

  // Check if google.maps.places (Places API New) is available in browser context
  const g = typeof window !== 'undefined' ? (window as any).google : undefined;
  if (g && g.maps && g.maps.importLibrary) {
    try {
      const placesLib = (await g.maps.importLibrary('places')) as any;
      if (placesLib && placesLib.AutocompleteSuggestion) {
        const token = sessionToken || (placesLib.AutocompleteSessionToken ? new placesLib.AutocompleteSessionToken() : undefined);
        const request: any = {
          input,
          includedRegionCodes: ['in'], // Restrict to India
        };
        if (token) {
          request.sessionToken = token;
        }

        const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (suggestions && suggestions.length > 0) {
          return suggestions.map((s: any) => {
            const placePrediction = s.placePrediction;
            return {
              placeId: placePrediction?.placeId || Math.random().toString(),
              mainText: placePrediction?.mainText?.text || placePrediction?.text?.text || input,
              secondaryText: placePrediction?.secondaryText?.text || 'India',
              fullText: placePrediction?.text?.text || input,
            };
          });
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('QuotaExceeded') || msg.includes('OverQuota') || msg.includes('RESOURCE_EXHAUSTED')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      console.warn('Google Places API autocomplete error, using fallback node directory:', err);
    }
  }

  // Fallback to built-in Indian nodes directory
  const matches = INDIAN_CITIES_NODES.filter(
    (city) =>
      city.name.toLowerCase().includes(query) ||
      (city.state && city.state.toLowerCase().includes(query))
  );

  if (matches.length > 0) {
    return matches.map((m) => ({
      placeId: m.id,
      mainText: m.name,
      secondaryText: m.state || 'India',
      fullText: `${m.name}, ${m.state || 'India'}`,
      location: { lat: m.lat, lng: m.lng },
    }));
  }

  return [
    {
      placeId: 'custom_' + Date.now(),
      mainText: input,
      secondaryText: 'India',
      fullText: `${input}, India`,
      location: { lat: 20.5937, lng: 78.9629 },
    },
  ];
}

/**
 * Resolves latitude and longitude for a selected Place ID or Place name
 */
export async function getPlaceCoordinates(
  placeId: string,
  placeName: string
): Promise<LatLngLiteral> {
  // If matched with our local nodes
  const localMatch = INDIAN_CITIES_NODES.find(
    (c) =>
      c.id === placeId ||
      c.name.toLowerCase() === placeName.toLowerCase() ||
      placeName.toLowerCase().includes(c.name.toLowerCase())
  );
  if (localMatch) {
    return { lat: localMatch.lat, lng: localMatch.lng };
  }

  // Try Google Place Class fetchFields
  const g = typeof window !== 'undefined' ? (window as any).google : undefined;
  if (g && g.maps && g.maps.importLibrary) {
    try {
      const placesLib = (await g.maps.importLibrary('places')) as any;
      if (placesLib && placesLib.Place) {
        const place = new placesLib.Place({ id: placeId });
        await place.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] });
        if (place.location) {
          return {
            lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
            lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng,
          };
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('QuotaExceeded') || msg.includes('OverQuota') || msg.includes('RESOURCE_EXHAUSTED')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      console.warn('Place.fetchFields error, falling back:', err);
    }
  }

  return { lat: 28.6139, lng: 77.2090 }; // Delhi fallback
}
