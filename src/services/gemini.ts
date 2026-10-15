// Client-side Gemini Service Proxy
// Communicates securely with the server-side Gemini service via /api/gemini/*
// Never imports @google/genai or exposes API keys in client-side code.

import {
  Journey,
  TravelStyle,
  PlaceDocument,
  HitchhikingSpot,
  BudgetJourneyResult,
  BudgetOptimizationResult,
  TravelAssistantResult,
  ModerationResult,
  JourneyRecommendation,
  RouteSegment,
} from '../types';
import { INITIAL_PLACES, INITIAL_HITCHHIKING_SPOTS } from '../data/mockData';
import { calculateBudgetJourney } from './routes';
import { getPlaces, getHitchhikingSpots } from './firestore';

/**
 * Helper to fetch verified places & spots from Firestore for grounding
 */
async function getApplicationContextData(): Promise<{
  places: PlaceDocument[];
  spots: HitchhikingSpot[];
}> {
  try {
    const [places, spots] = await Promise.all([
      getPlaces().catch(() => INITIAL_PLACES),
      getHitchhikingSpots().catch(() => INITIAL_HITCHHIKING_SPOTS),
    ]);
    return {
      places: places.length > 0 ? places : INITIAL_PLACES,
      spots: spots.length > 0 ? spots : INITIAL_HITCHHIKING_SPOTS,
    };
  } catch {
    return { places: INITIAL_PLACES, spots: INITIAL_HITCHHIKING_SPOTS };
  }
}

/**
 * 1. generateBudgetJourney
 * Input: origin, destination, budget, numberOfDays, travelStyle
 * Return structured JSON:
 * {
 *   summary,
 *   routeSegments[],
 *   estimatedTransportCost,
 *   estimatedFoodCost,
 *   estimatedStayCost,
 *   emergencyBudget,
 *   totalEstimatedCost,
 *   dailyAverage,
 *   recommendations[]
 * }
 * Each recommendation must reference an actual place ID when it comes from Firestore.
 */
export const generateBudgetJourney = async (params: {
  from: string;
  to: string;
  budget: number;
  days: number;
  travelStyle: TravelStyle;
}): Promise<Journey> => {
  // Baseline algorithmic calculation with verified Indian corridors and waypoints
  const baseJourney = await calculateBudgetJourney(params);
  const context = await getApplicationContextData();

  try {
    const response = await fetch('/api/gemini/generate-budget-journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: params.from,
        destination: params.to,
        budget: params.budget,
        numberOfDays: params.days,
        travelStyle: params.travelStyle,
        places: context.places,
        hitchhikingSpots: context.spots,
      }),
    });

    if (response.ok) {
      const data: BudgetJourneyResult = await response.json();
      if (data && Array.isArray(data.routeSegments) && Array.isArray(data.recommendations)) {
        return {
          ...baseJourney,
          summary: data.summary,
          routeSegments: data.routeSegments,
          recommendations: data.recommendations,
          estimatedTransportCost: data.estimatedTransportCost ?? baseJourney.estimatedTransportCost,
          estimatedFoodCost: data.estimatedFoodCost ?? baseJourney.estimatedFoodCost,
          estimatedAccommodationCost: data.estimatedStayCost ?? baseJourney.estimatedAccommodationCost,
          emergencyBudget: data.emergencyBudget ?? baseJourney.emergencyBudget,
          totalEstimatedCost: data.totalEstimatedCost ?? baseJourney.totalEstimatedCost,
          dailyAverage: data.dailyAverage ?? baseJourney.dailyAverage,
          notes: data.summary
            ? `${baseJourney.notes || ''}\n\n🤖 Gemini Travel Intelligence:\n${data.summary}`
            : baseJourney.notes,
        };
      }
    }
  } catch (error) {
    console.warn('[Gemini Client] Server API call failed, using grounded fallback:', error);
  }

  // Graceful grounded fallback
  const fallbackRecommendations: JourneyRecommendation[] = [
    {
      placeId: context.places[0]?.id || 'place_del_1',
      title: context.places[0]?.name || 'Gurudwara Bangla Sahib Langar',
      category: 'food',
      description: context.places[0]?.description || '24x7 sanctified hot meals served to all without charge.',
      cost: 0,
      informationType: 'VERIFIED_COMMUNITY',
      sourceName: 'Verified Community Record',
    },
    {
      title: 'Indian Railways RO Water ATMs',
      category: 'water',
      description: 'Refill drinking water for ₹5/L at railway platforms instead of buying ₹20 bottles.',
      cost: 5,
      informationType: 'ESTIMATED',
      sourceName: 'IRCTC Public Tariff',
    },
    {
      title: 'Daylight Highway Departure Strategy',
      category: 'safety',
      description: 'Start early morning by 06:30 AM to arrive before dusk. National highway emergency line: 1033.',
      cost: 0,
      informationType: 'AI_SUGGESTION',
      sourceName: 'RoamLite Backpacking Coach',
    },
  ];

  const fallbackSegments: RouteSegment[] = [
    {
      from: params.from,
      to: `${params.from} Highway Outskirts`,
      distanceKm: 25,
      recommendedMode: 'City bus or suburban EMU local train',
      estimatedCost: 20,
      tips: 'Catch the early morning local train to beat city traffic.',
      informationType: 'ESTIMATED',
    },
    {
      from: `${params.from} Highway Outskirts`,
      to: params.to,
      distanceKm: 320,
      recommendedMode: params.travelStyle === 'Cheapest' ? 'Unreserved 2S passenger train or daytime toll bay hitch' : 'State RTC bus',
      estimatedCost: baseJourney.estimatedTransportCost,
      tips: 'Carry water and cash reserve. Check driver demeanor before accepting rides.',
      informationType: params.travelStyle === 'Cheapest' ? 'VERIFIED_COMMUNITY' : 'ESTIMATED',
    },
  ];

  return {
    ...baseJourney,
    summary: `Grounded route from ${params.from} to ${params.to} using unreserved transit and verified community halts.`,
    routeSegments: fallbackSegments,
    recommendations: fallbackRecommendations,
  };
};

/**
 * 2. optimizeBudget
 * Given an existing journey and budget, suggest ways to reduce costs.
 */
export const optimizeBudget = async (
  currentJourney: Journey,
  targetBudget: number
): Promise<{
  optimizedJourney: Journey;
  savingsTips: string[];
  recommendations?: JourneyRecommendation[];
}> => {
  const context = await getApplicationContextData();

  try {
    const response = await fetch('/api/gemini/optimize-budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        journey: currentJourney,
        targetBudget,
        places: context.places,
        hitchhikingSpots: context.spots,
      }),
    });

    if (response.ok) {
      const data: BudgetOptimizationResult = await response.json();
      if (data && data.adjustedBreakdown && Array.isArray(data.savingsTips)) {
        const optimized: Journey = {
          ...currentJourney,
          budget: targetBudget,
          estimatedTransportCost: data.adjustedBreakdown.estimatedTransportCost,
          estimatedFoodCost: data.adjustedBreakdown.estimatedFoodCost,
          estimatedAccommodationCost: data.adjustedBreakdown.estimatedStayCost ?? data.adjustedBreakdown.estimatedAccommodationCost,
          emergencyBudget: data.adjustedBreakdown.emergencyBudget,
          totalEstimatedCost: data.adjustedBreakdown.totalEstimatedCost,
          dailyAverage: data.adjustedBreakdown.dailyAverage,
          recommendations: data.recommendations?.map((r) => ({
            placeId: r.placeId,
            title: r.action,
            category: r.category as any,
            description: r.details,
            cost: -r.potentialSavings,
            informationType: r.informationType,
          })) || currentJourney.recommendations,
        };

        return {
          optimizedJourney: optimized,
          savingsTips: data.savingsTips,
          recommendations: optimized.recommendations,
        };
      }
    }
  } catch (error) {
    console.warn('[Gemini Client] optimizeBudget fetch failed, falling back:', error);
  }

  // Graceful algorithmic fallback
  const reductionRatio = Math.min(1, targetBudget / Math.max(1, currentJourney.totalEstimatedCost));
  const optimized: Journey = {
    ...currentJourney,
    budget: targetBudget,
    estimatedTransportCost: Math.round(currentJourney.estimatedTransportCost * (reductionRatio < 0.8 ? 0.7 : 0.85)),
    estimatedFoodCost: Math.round(currentJourney.estimatedFoodCost * 0.8),
    estimatedAccommodationCost: Math.round(currentJourney.estimatedAccommodationCost * 0.75),
    emergencyBudget: Math.round(Math.max(200, targetBudget * 0.1)),
    totalEstimatedCost: targetBudget,
    dailyAverage: Math.round(targetBudget / Math.max(1, currentJourney.days)),
  };

  const defaultTips = [
    'Switch from private sleeper bus to unreserved second-class passenger train (saves ₹150-₹300)',
    'Eat at least one meal at a verified Gurudwara Langar or pilgrim Annakshetra (saves ₹80-₹120/day)',
    'Refill drinking water exclusively at Railway RO Water ATMs (₹5/L vs ₹20 packaged bottle)',
    'Pitch your tent at verified wild camping spots or stay at pilgrim sarais (saves ₹200-₹400/night)',
  ];

  return {
    optimizedJourney: optimized,
    savingsTips: defaultTips,
  };
};

/**
 * 3. travelAssistant
 * Answer questions using verified application data.
 */
export const travelAssistant = async (
  query: string,
  history: { role: 'user' | 'model'; text: string }[] = [],
  contextData?: { places: PlaceDocument[]; spots: HitchhikingSpot[] }
): Promise<string> => {
  const context = contextData || (await getApplicationContextData());

  try {
    const response = await fetch('/api/gemini/travel-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        history,
        places: context.places,
        hitchhikingSpots: context.spots,
      }),
    });

    if (response.ok) {
      const data: TravelAssistantResult = await response.json();
      if (data && typeof data.reply === 'string') {
        let fullReply = data.reply;
        // Append safety alerts if returned
        if (data.safetyAlerts && data.safetyAlerts.length > 0) {
          fullReply += `\n\n🛡️ Safety Notes:\n${data.safetyAlerts.map((a) => `• ${a}`).join('\n')}`;
        }
        return fullReply;
      }
    }
  } catch (error) {
    console.warn('[Gemini Client] travelAssistant fetch failed, using grounded fallback:', error);
  }

  // Graceful grounded response based on verified query patterns
  const q = query.toLowerCase();
  if (q.includes('safe') && q.includes('hitchhik')) {
    return `⚠️ Safety First on Indian Highways:\n
1. Never hitchhike alone at night; strictly stick to daylight hours (06:00 AM – 05:00 PM).\n
2. Murthal (NH44), Dharuhera (NH48), and Nelamangala (NH75) are among the most active daytime toll bays.\n
3. Always check the driver's demeanor, never get into a vehicle smelling of alcohol, and immediately text the vehicle number plate to family.\n
4. National Highway Emergency Helpline: 1033 | All-India Emergency: 112.`;
  }

  if (q.includes('water') || q.includes('ro water')) {
    return `💧 RoamLite Water Rule: Never spend ₹20 on single-use bottled water! Every major Indian Railways station features automated IRCTC RO Water kiosks dispensing WHO-standard filtered water for just ₹5 per litre. Bring your own 1L insulated flask and save up to ₹1,500 over a month.`;
  }

  if (q.includes('free food') || q.includes('langar')) {
    return `🍲 Sanctified Community Meals (Langar):\n
- Gurudwaras across India (e.g. Bangla Sahib in Delhi, Golden Temple in Amritsar, Sis Ganj in Old Delhi) serve wholesome hot meals 24x7 without discrimination.\n
- Kashi Vishwanath Annakshetra in Varanasi and temple dining halls in South India provide nutritious afternoon thalis.\n
- Backpacker Etiquette: Cover your head, take off your shoes, never waste any food on your plate, and offer volunteer service (sewa) like washing dishes or sweeping if you have 30 minutes!`;
  }

  return `Namaste nomad! As your RoamLite guide, I recommend exploring our community-verified spots along Indian highway corridors. You can find free Gurudwara langars, ₹5 railway RO water ATMs, and safe toll bay hitchhiking spots directly on the Map tab. Always travel daylight-first and keep your emergency helpline (1033 / 112) handy!`;
};

/**
 * 4. moderateUserContent
 * Classify content as: approved, needs_review, rejected.
 * Never allow Gemini to directly modify Firestore.
 */
export const moderateUserContent = async (
  text: string,
  type?: string
): Promise<{
  approved: boolean;
  classification: 'approved' | 'needs_review' | 'rejected';
  reason?: string;
  flaggedReason?: string;
  confidence?: number;
  flags?: string[];
}> => {
  try {
    const response = await fetch('/api/gemini/moderate-user-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type }),
    });

    if (response.ok) {
      const data: ModerationResult = await response.json();
      if (data && ['approved', 'needs_review', 'rejected'].includes(data.classification)) {
        return {
          approved: data.classification === 'approved',
          classification: data.classification,
          reason: data.reason,
          flaggedReason: data.classification !== 'approved' ? data.reason : undefined,
          confidence: data.confidence,
          flags: data.flags,
        };
      }
    }
  } catch (error) {
    console.warn('[Gemini Client] moderateUserContent fetch failed, falling back:', error);
  }

  // Graceful rule-based fallback
  const lower = text.toLowerCase();
  const prohibitedPatterns = [
    'guaranteed safe',
    '100% safe hitchhiking',
    'sleep anywhere without checking',
    'drugs',
    'weed seller',
    'charas',
    'ganja',
  ];

  for (const pattern of prohibitedPatterns) {
    if (lower.includes(pattern)) {
      return {
        approved: false,
        classification: 'rejected',
        reason: `Content contains prohibited claim or keyword: "${pattern}". Safety confidence cannot be guaranteed.`,
        flaggedReason: `Content contains prohibited claim or keyword: "${pattern}". Safety confidence cannot be guaranteed.`,
        flags: ['prohibited_pattern'],
      };
    }
  }

  return {
    approved: true,
    classification: 'approved',
    reason: 'Content passed safety filters.',
    flags: [],
  };
};
