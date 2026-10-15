import React, { useState } from 'react';
import { PlaceType, HitchhikingDifficulty, UserProfile } from '../types';
import { addPlace, addHitchhikingSpot } from '../services/firestore';
import { moderateUserContent } from '../services/gemini';
import { uploadPhoto } from '../services/storage';
import { CATEGORY_ICONS_LABEL } from '../services/maps';
import { 
  PlusCircle, 
  ThumbsUp, 
  MapPin, 
  IndianRupee, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Camera, 
  Upload, 
  ShieldCheck,
  AlertCircle,
  LogIn
} from 'lucide-react';

interface AddPageProps {
  currentUser: UserProfile | null;
  onRequireAuth: (reason?: string) => void;
  onSuccess: (type: 'place' | 'spot', id: string) => void;
}

export const AddPage: React.FC<AddPageProps> = ({
  currentUser,
  onRequireAuth,
  onSuccess
}) => {
  const [contributionMode, setContributionMode] = useState<'place' | 'hitchhiking'>('place');

  // Place Form State
  const [placeName, setPlaceName] = useState('');
  const [placeType, setPlaceType] = useState<PlaceType>('food');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Uttarakhand');
  const [landmark, setLandmark] = useState('');
  const [priceMin, setPriceMin] = useState<number | ''>(0);
  const [priceMax, setPriceMax] = useState<number | ''>(50);
  const [timing, setTiming] = useState('Open 24 Hours');
  const [tagsInput, setTagsInput] = useState('');
  const [sourceInfo, setSourceInfo] = useState('');

  // Hitchhiking Form State
  const [spotName, setSpotName] = useState('');
  const [roadName, setRoadName] = useState('NH44 (Grand Trunk Road)');
  const [direction, setDirection] = useState('Northbound towards Chandigarh / Manali');
  const [difficulty, setDifficulty] = useState<HitchhikingDifficulty>('Easy');
  const [waitMinutes, setWaitMinutes] = useState(20);
  const [bestTime, setBestTime] = useState('06:30 AM - 10:00 AM');
  const [hitchNotes, setHitchNotes] = useState('');
  const [vehicles, setVehicles] = useState('Trucks, Private Cars, Tempos');

  // Coordinates
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');

  // Photo state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If not signed in, show clean sign-in prompt instead of broken form
  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center text-[#17211B]">
        <div className="w-16 h-16 rounded-3xl bg-[#E8F5EC] border border-[#1F7A4D]/20 flex items-center justify-center text-[#1F7A4D] mb-4 shadow-sm">
          <PlusCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-[#17211B] mb-2">
          Contribute a Spot to Moove India
        </h2>
        <p className="text-xs sm:text-sm text-[#66736B] max-w-sm mb-6 leading-relaxed">
          Public visitors can freely browse all destinations. To ensure safety and prevent spam, please register or sign in to contribute verified budget spots or hitchhiking bays.
        </p>
        <button
          onClick={() => onRequireAuth('Sign in to submit a new budget spot or hitch corridor')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1F7A4D] hover:bg-[#19633e] text-white py-3 px-6 text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In / Create Account</span>
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(4));
          setLng(pos.coords.longitude.toFixed(4));
        },
        () => {
          setError('Unable to fetch device GPS. Enter latitude & longitude manually.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const latNum = Number(lat) || 28.6139;
    const lngNum = Number(lng) || 77.2090;

    try {
      let uploadedPhotoUrl: string | undefined = undefined;
      if (selectedFile) {
        uploadedPhotoUrl = await uploadPhoto(
          selectedFile,
          contributionMode === 'place' ? 'places' : 'hitchhikingSpots'
        );
      }

      if (contributionMode === 'place') {
        const textToCheck = `${placeName} ${description} ${landmark}`;
        const mod = await moderateUserContent(textToCheck);
        if (!mod.approved) {
          setError(mod.flaggedReason || 'Submission was flagged by safety filter. Please revise content.');
          setLoading(false);
          return;
        }

        const tags = tagsInput
          ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

        const newPlace = await addPlace({
          name: placeName.trim(),
          type: placeType,
          description: description.trim(),
          location: {
            lat: latNum,
            lng: lngNum,
            landmark: landmark.trim() || undefined,
          },
          city: city.trim() || 'New Delhi',
          state: state.trim() || 'Delhi',
          priceMin: Number(priceMin) || 0,
          priceMax: Number(priceMax) || 0,
          rating: 4.8,
          createdBy: currentUser.id,
          creatorName: currentUser.displayName,
          tags,
          timing,
          photoUrl: uploadedPhotoUrl,
        });

        setSuccessMessage('Spot submitted successfully! It is currently in Pending Review status until approved by community moderators.');
        onSuccess('place', newPlace.id);
      } else {
        const textToCheck = `${spotName} ${hitchNotes} ${direction}`;
        const mod = await moderateUserContent(textToCheck);
        if (!mod.approved) {
          setError(mod.flaggedReason || 'Submission was flagged by safety filter.');
          setLoading(false);
          return;
        }

        const vehicleList = vehicles
          ? vehicles.split(',').map((v) => v.trim()).filter(Boolean)
          : ['Trucks', 'Cars'];

        const newSpot = await addHitchhikingSpot({
          name: spotName.trim(),
          location: {
            lat: latNum,
            lng: lngNum,
            landmark: landmark.trim() || undefined,
          },
          roadName: roadName.trim(),
          direction: direction.trim(),
          difficulty,
          averageWaitMinutes: Number(waitMinutes) || 20,
          bestTime: bestTime.trim(),
          safetyRating: 4.5,
          createdBy: currentUser.id,
          creatorName: currentUser.displayName,
          vehicleTypes: vehicleList,
          notes: hitchNotes.trim(),
          photoUrl: uploadedPhotoUrl,
        });

        setSuccessMessage('Hitchhiking point submitted! Placed in Pending Review status until community verification.');
        onSuccess('spot', newSpot.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit spot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12 text-[#17211B] bg-[#F8FAF7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8E3] p-4 sm:p-5">
        <div className="max-w-3xl mx-auto space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20">
              <PlusCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#17211B]">
              Add a Budget Spot
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#66736B]">
            Contribute a verified free water ATM, Gurudwara langar, clean shower, or safe hitchhiking bay. All submissions undergo community moderation.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Pending Review Notice */}
        <div className="p-3.5 rounded-2xl bg-[#E8F5EC] border border-[#1F7A4D]/20 flex items-start gap-2.5 text-xs text-[#17211B]">
          <ShieldCheck className="w-4 h-4 text-[#1F7A4D] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#1F7A4D] block">Pending Review Policy</span>
            <p className="text-[#66736B] leading-relaxed">
              New submissions initially have a <strong>Pending Review</strong> status. They cannot immediately become verified to ensure community safety.
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-2xl bg-white p-1 border border-[#E2E8E3] shadow-sm">
          <button
            type="button"
            onClick={() => setContributionMode('place')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              contributionMode === 'place'
                ? 'bg-[#1F7A4D] text-white shadow-sm'
                : 'text-[#66736B] hover:text-[#17211B]'
            }`}
          >
            <span>Community Spot (Food, Stay, Water)</span>
          </button>
          <button
            type="button"
            onClick={() => setContributionMode('hitchhiking')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              contributionMode === 'hitchhiking'
                ? 'bg-[#1F7A4D] text-white shadow-sm'
                : 'text-[#66736B] hover:text-[#17211B]'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Hitchhiking Corridor Point</span>
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-[#D9534F]/30 text-[#D9534F] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="rounded-3xl bg-white border border-[#E2E8E3] p-5 sm:p-6 space-y-4 shadow-sm">
          {contributionMode === 'place' ? (
            <>
              {/* Category Picker */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                  Category *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['food', 'stay', 'water', 'camping', 'shower', 'charging'] as PlaceType[]).map((type) => {
                    const meta = CATEGORY_ICONS_LABEL[type];
                    const isSelected = placeType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPlaceType(type)}
                        className={`p-2 rounded-xl text-xs font-bold border transition text-center flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-[#E8F5EC] border-[#1F7A4D] text-[#1F7A4D]'
                            : 'bg-[#F8FAF7] border-[#E2E8E3] text-[#66736B] hover:border-[#1F7A4D]'
                        }`}
                      >
                        <span className="text-base">{meta.symbol}</span>
                        <span className="text-[10px] capitalize">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spot Name */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                  Spot / Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g. Gurudwara Bangla Sahib Langar, RO Water ATM #2"
                  className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-3 text-xs sm:text-sm text-[#17211B] placeholder-[#66736B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                  Detailed Description & Tips *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain meal timings, water quality, cleanliness, rules (e.g. head cover required, bring your own reusable bottle)..."
                  className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-3 text-xs text-[#17211B] placeholder-[#66736B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white transition"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Rishikesh, Amritsar, Hampi"
                    className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-2.5 text-xs text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Uttarakhand, Punjab, Karnataka"
                    className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-2.5 text-xs text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                  />
                </div>
              </div>

              {/* Landmark */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                  Nearest Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite Ram Jhula, Platform 1 Exit Gate"
                  className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-2.5 text-xs text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                />
              </div>

              {/* Estimated Budget Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                    Min Price (₹) (0 if Free)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-2.5 text-xs font-bold text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                    Max Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-2.5 text-xs font-bold text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Hitchhiking Point Name */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                  Hitchhiking Bay / Lift Point *
                </label>
                <input
                  type="text"
                  required
                  value={spotName}
                  onChange={(e) => setSpotName(e.target.value)}
                  placeholder="e.g. Murthal Toll Plaza Truck Bay"
                  className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-3 text-xs sm:text-sm text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                />
              </div>

              {/* Highway & Direction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                    Highway / Road *
                  </label>
                  <input
                    type="text"
                    required
                    value={roadName}
                    onChange={(e) => setRoadName(e.target.value)}
                    placeholder="e.g. NH44, NH48, SH10"
                    className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-2.5 text-xs text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                    Direction *
                  </label>
                  <input
                    type="text"
                    required
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    placeholder="e.g. Northbound towards Manali"
                    className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-2.5 text-xs text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                  />
                </div>
              </div>

              {/* Hitch Notes */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                  Field Hitchhiking Notes & Best Hours *
                </label>
                <textarea
                  required
                  rows={3}
                  value={hitchNotes}
                  onChange={(e) => setHitchNotes(e.target.value)}
                  placeholder="Where to stand for best visibility, safety notes, trucker rest stops..."
                  className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-3 text-xs text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                />
              </div>
            </>
          )}

          {/* Location Coordinates */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#17211B] uppercase tracking-wider">
                Map Coordinates *
              </span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-[11px] font-bold text-[#1F7A4D] hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Use My GPS</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#66736B] block mb-0.5">Latitude</label>
                <input
                  type="text"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#E2E8E3] p-2 text-xs font-mono text-[#17211B]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#66736B] block mb-0.5">Longitude</label>
                <input
                  type="text"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#E2E8E3] p-2 text-xs font-mono text-[#17211B]"
                />
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
              Spot Photo (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] hover:border-[#1F7A4D] text-xs font-semibold text-[#17211B] cursor-pointer transition">
                <Camera className="w-4 h-4 text-[#1F7A4D]" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Spot preview"
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-[#1F7A4D]"
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#1F7A4D] hover:bg-[#19633e] text-white font-black text-xs sm:text-sm shadow-md transition active:scale-[0.99]"
          >
            {loading ? 'Submitting to Moderation Queue...' : 'Submit for Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
