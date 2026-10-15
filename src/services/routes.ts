import { TravelStyle, Journey, JourneyStop } from '../types';
import { calculateDistanceKm } from './maps';
import { getCoordinatesForPlaceName, INDIAN_CITIES_NODES } from './places';

export interface RouteCalculationParams {
  from: string;
  to: string;
  budget: number;
  days: number;
  travelStyle: TravelStyle;
}

export const calculateBudgetJourney = async (params: RouteCalculationParams): Promise<Journey> => {
  const { from, to, budget, days, travelStyle } = params;

  const startCoords = getCoordinatesForPlaceName(from);
  const endCoords = getCoordinatesForPlaceName(to);
  const straightDistKm = calculateDistanceKm(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
  // Real Indian road/rail distance is typically 1.25x - 1.4x straight line
  const approxRoadDistanceKm = Math.max(80, Math.round(straightDistKm * 1.3));

  // Determine budget splits based on Indian backpacker realities
  let transportMultiplier = 0.3; // ₹/km
  let foodPerDay = 150;
  let stayPerDay = 200;

  if (travelStyle === 'Cheapest') {
    // Heavy reliance on hitchhiking + unreserved general trains + langars
    transportMultiplier = 0.12; 
    foodPerDay = 90; // Langar, ₹40 thali, roadside bananas & biscuits
    stayPerDay = 100; // Gurudwara sarai, night station hall, wild tenting
  } else if (travelStyle === 'Balanced') {
    // State transport buses (HRTC/MSRTC) + sleeper train + ashram/dharamshala
    transportMultiplier = 0.55; 
    foodPerDay = 160;
    stayPerDay = 250;
  } else if (travelStyle === 'Adventure') {
    // Mixed mountain hitching, local shared sumos, camp spots, trail food
    transportMultiplier = 0.45;
    foodPerDay = 140;
    stayPerDay = 120; // 50% tent camping + 50% village homestays
  }

  const estimatedTransportCost = Math.round(approxRoadDistanceKm * transportMultiplier);
  const estimatedFoodCost = Math.round(foodPerDay * days);
  const estimatedAccommodationCost = Math.round(stayPerDay * Math.max(1, days - 1));
  const emergencyBudget = Math.round(Math.max(300, budget * 0.12));

  const totalEstimatedCost = estimatedTransportCost + estimatedFoodCost + estimatedAccommodationCost + emergencyBudget;
  const dailyAverage = Math.round(totalEstimatedCost / Math.max(1, days));

  // Generate realistic intermediate stops between start and end
  const suggestedStops: JourneyStop[] = [];

  for (let day = 1; day <= days; day++) {
    const progressFraction = day / days;
    const currentLat = startCoords.lat + (endCoords.lat - startCoords.lat) * progressFraction;
    const currentLng = startCoords.lng + (endCoords.lng - startCoords.lng) * progressFraction;

    let stopName = day === days ? to : `Day ${day} Transit Point`;
    
    // Find closest recognized Indian city or node along the corridor
    const nearbyNode = INDIAN_CITIES_NODES
      .map(node => ({
        ...node,
        dist: calculateDistanceKm(currentLat, currentLng, node.lat, node.lng)
      }))
      .sort((a, b) => a.dist - b.dist)[0];

    if (nearbyNode && nearbyNode.dist < 180 && day !== days) {
      stopName = `${nearbyNode.name} Corridor`;
    }

    let stayText = '';
    let foodText = '';
    let transitTip = '';

    if (travelStyle === 'Cheapest') {
      stayText = day === days ? 'Local Gurudwara Sarai (₹100) or railway waiting hall' : 'Toll plaza rest bay / temple premises';
      foodText = 'Gurudwara Langar or roadside dhaba dal-roti (₹50-₹70)';
      transitTip = 'Hitchhike from toll plaza or take unreserved second-class passenger train';
    } else if (travelStyle === 'Balanced') {
      stayText = day === days ? 'Budget backpacker dorm or pilgrim ashram (₹250-₹350)' : 'Dharamshala double room shared (₹200)';
      foodText = 'Unlimited regional thali or clean student bhojnalaya (₹80-₹100)';
      transitTip = 'Ordinary state RTC bus (HRTC/MSRTC/KSRTC) or overnight unreserved sleeper';
    } else {
      stayText = 'Wild campsite (tent pitched) or local village homestay (₹150)';
      foodText = 'Carry dry muesli, nuts, ORS + evening hot khichdi at local tea shack';
      transitTip = 'Shared mountain Bolero or hitching with empty goods transport';
    }

    suggestedStops.push({
      id: `stop_${day}_${Date.now()}`,
      name: stopName,
      lat: Number(currentLat.toFixed(4)),
      lng: Number(currentLng.toFixed(4)),
      day,
      highlights: [
        `Kilometer mark: approx ~${Math.round(approxRoadDistanceKm * progressFraction)} km`,
        travelStyle === 'Cheapest' ? 'Verified drinking water ATM' : 'Scenic photo stop',
        'Active community backpacker hub'
      ],
      staySuggestion: stayText,
      foodSuggestion: foodText,
      transitTip,
      approxDailyCost: Math.round(dailyAverage)
    });
  }

  return {
    id: 'journey_' + Date.now().toString(36),
    from,
    to,
    budget,
    days,
    travelStyle,
    estimatedTransportCost,
    estimatedFoodCost,
    estimatedAccommodationCost,
    emergencyBudget,
    totalEstimatedCost,
    dailyAverage,
    suggestedStops,
    notes: `Generated for ultra-budget exploration between ${from} and ${to}. Covers ${approxRoadDistanceKm} km across Indian highways and scenic corridors.`,
    createdAt: new Date().toISOString()
  };
};
