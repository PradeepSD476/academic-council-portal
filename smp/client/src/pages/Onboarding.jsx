import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/toast';
import api from '../lib/api';
import { Button } from '../components/ui/button';

// Form Presets
const PRESET_TECH = ['Web Development', 'Mobile Development', 'Machine Learning', 'Data Science', 'Cyber Security', 'Blockchain', 'Cloud Computing', 'Game Dev', 'IoT', 'DevOps'];
const PRESET_LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Bengali', 'Marathi', 'Punjabi', 'Malayalam', 'Gujarati'];
const PRESET_SPORTS = ['Cricket', 'Football', 'Basketball', 'Badminton', 'Table Tennis', 'Chess', 'Swimming', 'Athletics', 'Volleyball', 'Lawn Tennis'];
const PRESET_CULT = ['Music & Singing', 'Dance', 'Dramatics & Acting', 'Fine Arts & Sketching', 'Photography & Film', 'Debating', 'Literature & Poetry', 'Design & UI/UX'];
const PRESET_HOBBIES = ['Reading', 'Gaming', 'Traveling', 'Cooking', 'Gardening', 'Writing & Blogging', 'Hiking & Trekking', 'Anime & Manga', 'Podcasting'];
const PRESET_GOALS = ['Placements', 'Higher Studies (MS/MTech)', 'Research & Academia', 'Entrepreneurship / Startup', 'Competitive Programming', 'Open Source Contrib', 'Public Speaking', 'Civil Services (UPSC)'];

const BRANCHES = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Metallurgical & Materials Engineering',
  'Bio-Technology',
  'Physics & Sciences'
];

export default function Onboarding() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [branch, setBranch] = useState('');
  const [preference, setPreference] = useState('NO_PREFERENCE');
  const [techInterests, setTechInterests] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [sportsInterests, setSportsInterests] = useState([]);
  const [cultInterests, setCultInterests] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [goals, setGoals] = useState([]);

  const { logout, setHasSubmittedQuestionnaire } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await api.get('/onboarding/config');
        setConfig(response.data);
      } catch (error) {
        toast({
          title: 'Config Fetch Failed',
          description: 'Failed to load onboarding configurations. Using defaults.',
          variant: 'error',
        });
        setConfig({ isRegistrationOpen: true, academicYear: '2026-27' });
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchConfig();
  }, [toast]);

  const toggleSelection = (item, selectedList, setSelectedList) => {
    if (selectedList.includes(item)) {
      setSelectedList(selectedList.filter((x) => x !== item));
    } else {
      setSelectedList([...selectedList, item]);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!branch) {
        toast({
          title: 'Validation Error',
          description: 'Please select your branch before continuing.',
          variant: 'error',
        });
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        branch,
        techInterests,
        sportsInterests,
        cultInterests,
        languages,
        hobbies,
        goals,
        preference,
      };

      await api.post('/onboarding/questionnaire', payload);
      setHasSubmittedQuestionnaire();
      toast({
        title: 'Success',
        description: 'Questionnaire submitted successfully!',
        variant: 'success',
      });
      navigate('/waiting-room');
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: error.response?.data?.message || 'Something went wrong.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface text-on-surface gap-4 font-body-md transition-colors duration-300">
        <div className="w-16 h-16 rounded-2xl border border-outline-variant/20 bg-surface-container-low flex items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
        <span className="text-sm text-secondary font-medium tracking-wide">Loading portal configurations...</span>
      </div>
    );
  }

  // Registration Closed State
  if (config && !config.isRegistrationOpen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface p-6 font-body-md transition-colors duration-300">
        <div className="relative z-10 max-w-md w-full rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest shadow-xl p-10 text-center">
          <div className="mt-4 h-16 w-16 bg-error-container text-error rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-error/10 border border-error/20">
            <span className="material-symbols-outlined text-[32px]">block</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mt-6 mb-3 tracking-tight">Registration Closed</h2>
          <p className="text-secondary text-sm leading-relaxed mb-8">
            The onboarding questionnaire for the academic cycle {config.academicYear || '2026-2027'} is currently closed. If you believe this is an error, please reach out to your administrator.
          </p>
          <button
            onClick={logout}
            className="w-full py-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container transition-all duration-200 active:scale-[0.98] font-semibold text-sm"
          >
            Sign Out / Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-start bg-background text-on-background p-4 sm:p-5 lg:p-6 font-body-md relative transition-colors duration-300">
      {/* Ambient Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[70%] bg-blue-300/30 blur-[140px] rounded-full mix-blend-multiply"></div>
        <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[70%] bg-amber-200/40 blur-[140px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-200/20 blur-[140px] rounded-full mix-blend-multiply"></div>
      </div>

      {/* Header Bar */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex justify-between items-center mb-4 pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111827] mb-0.5 leading-tight">
            Student <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">Onboarding</span>
          </h1>
          <p className="text-on-surface-variant/80 text-xs md:text-sm">
            Complete your profile to unlock <span className="font-serif italic font-normal text-[#111827]">expert mentorship</span>.
          </p>
        </div>
        <button
          onClick={logout}
          className="text-xs md:text-sm font-semibold text-secondary hover:text-on-surface flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-surface/50 hover:bg-surface-container border border-outline-variant/20 transition-all duration-200 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] md:text-[18px]">logout</span>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      <div className="relative z-10 max-w-5xl w-full mx-auto flex-grow flex flex-col lg:flex-row items-stretch gap-4 pb-2">
        
        {/* Left Sidebar (Step Indicators) */}
        <div className="w-full lg:w-56 shrink-0 bg-surface/80 backdrop-blur-xl shadow-xl shadow-primary/5 border border-outline-variant/20 rounded-tl-3xl rounded-br-[3rem] rounded-tr-lg rounded-bl-xl p-4 lg:p-5 flex flex-col justify-center">
          <div className="space-y-4 relative before:absolute before:inset-y-4 before:left-[19px] before:w-[2px] before:bg-outline-variant/30">
            {/* Step 1 */}
            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${currentStep >= 1 ? 'bg-primary text-on-primary ring-4 ring-primary/20' : 'bg-surface-container text-secondary'}`}>
                <span className="material-symbols-outlined text-[18px]">school</span>
              </div>
              <span className={`text-sm md:text-body-md transition-colors ${currentStep >= 1 ? 'text-on-surface font-semibold' : 'text-secondary'}`}>Core Profile</span>
            </div>
            {/* Step 2 */}
            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${currentStep >= 2 ? 'bg-primary text-on-primary ring-4 ring-primary/20' : 'bg-surface-container text-secondary'}`}>
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <span className={`text-sm md:text-body-md transition-colors ${currentStep >= 2 ? 'text-on-surface font-semibold' : 'text-secondary'}`}>Technical Skills</span>
            </div>
            {/* Step 3 */}
            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${currentStep >= 3 ? 'bg-primary text-on-primary ring-4 ring-primary/20' : 'bg-surface-container text-secondary'}`}>
                <span className="material-symbols-outlined text-[18px]">emoji_objects</span>
              </div>
              <span className={`text-sm md:text-body-md transition-colors ${currentStep >= 3 ? 'text-on-surface font-semibold' : 'text-secondary'}`}>Goals & Hobbies</span>
            </div>
          </div>
        </div>

        {/* Main Wizard Container */}
        <div className="flex-1 w-full bg-surface/80 backdrop-blur-xl rounded-tr-3xl rounded-bl-[3rem] rounded-tl-lg rounded-br-xl overflow-hidden shadow-xl shadow-primary/5 border border-outline-variant/20 transition-all duration-300 relative flex flex-col">
          
          {/* Progress Bar Top */}
          <div className="p-4 border-b border-outline-variant/10">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-label-caps text-primary font-semibold">STEP {currentStep} OF 3</span>
              <span className="text-label-caps text-secondary font-medium">{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-center">
            {/* STEP 1: Core Profile */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-body-lg font-semibold text-on-surface">Academic Branch</label>
                  <p className="text-sm text-secondary">Select your current academic discipline at IIT Patna.</p>
                  <div className="relative max-w-md">
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full appearance-none bg-surface-container-low text-on-surface text-sm rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow border border-outline-variant/20 cursor-pointer"
                    >
                      <option value="" disabled>Select your branch</option>
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-body-lg font-semibold text-on-surface mb-0.5">Mentorship Track Preference</label>
                    <p className="text-sm text-secondary">Which career direction are you seeking guidance for?</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* CORE */}
                    <button
                      type="button"
                      onClick={() => setPreference('CORE')}
                      className={`group relative flex flex-col rounded-2xl text-left border transition-all duration-300 overflow-hidden p-4 ${
                        preference === 'CORE' ? 'bg-primary-container/10 border-primary-container shadow-md shadow-primary/5' : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container hover:shadow-sm'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-primary transition-opacity duration-300 ${preference === 'CORE' ? 'opacity-5' : 'opacity-0'}`} />
                      <div className="flex items-center justify-between relative z-10 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${preference === 'CORE' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-primary'}`}>
                          <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${preference === 'CORE' ? 'border-primary' : 'border-outline-variant'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full transition-transform bg-primary ${preference === 'CORE' ? 'scale-100' : 'scale-0'}`} />
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-on-surface mb-1 relative z-10">CORE</h4>
                      <p className="text-xs text-secondary relative z-10 leading-relaxed">Hardware, Manufacturing, R&D, Core Engineering roles.</p>
                    </button>

                    {/* NON-CORE */}
                    <button
                      type="button"
                      onClick={() => setPreference('NON_CORE')}
                      className={`group relative flex flex-col rounded-2xl text-left border transition-all duration-300 overflow-hidden p-4 ${
                        preference === 'NON_CORE' ? 'bg-primary-container/10 border-primary-container shadow-md shadow-primary/5' : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container hover:shadow-sm'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-primary transition-opacity duration-300 ${preference === 'NON_CORE' ? 'opacity-5' : 'opacity-0'}`} />
                      <div className="flex items-center justify-between relative z-10 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${preference === 'NON_CORE' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-primary'}`}>
                          <span className="material-symbols-outlined text-[18px]">code</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${preference === 'NON_CORE' ? 'border-primary' : 'border-outline-variant'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full transition-transform bg-primary ${preference === 'NON_CORE' ? 'scale-100' : 'scale-0'}`} />
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-on-surface mb-1 relative z-10">NON-CORE</h4>
                      <p className="text-xs text-secondary relative z-10 leading-relaxed">Software, Data, Finance, Consulting, PM.</p>
                    </button>

                    {/* NO PREFERENCE */}
                    <button
                      type="button"
                      onClick={() => setPreference('NO_PREFERENCE')}
                      className={`group relative flex flex-col rounded-2xl text-left border transition-all duration-300 overflow-hidden p-4 ${
                        preference === 'NO_PREFERENCE' ? 'bg-primary-container/10 border-primary-container shadow-md shadow-primary/5' : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container hover:shadow-sm'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-primary transition-opacity duration-300 ${preference === 'NO_PREFERENCE' ? 'opacity-5' : 'opacity-0'}`} />
                      <div className="flex items-center justify-between relative z-10 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${preference === 'NO_PREFERENCE' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-primary'}`}>
                          <span className="material-symbols-outlined text-[18px]">explore</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${preference === 'NO_PREFERENCE' ? 'border-primary' : 'border-outline-variant'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full transition-transform bg-primary ${preference === 'NO_PREFERENCE' ? 'scale-100' : 'scale-0'}`} />
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-on-surface mb-1 relative z-10">NO PREFERENCE</h4>
                      <p className="text-xs text-secondary relative z-10 leading-relaxed">Flexible path. Willing to align with any group.</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Technical & Languages */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-body-lg font-semibold text-on-surface mb-0.5">Technical Fields of Interest</label>
                    <p className="text-sm text-secondary">Select all areas you are currently exploring or want to learn.</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {PRESET_TECH.map((tech) => {
                      const isSelected = techInterests.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => toggleSelection(tech, techInterests, setTechInterests)}
                          className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                            isSelected ? 'bg-primary text-on-primary shadow-sm scale-105' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <span>{tech}</span>
                          <span className={`material-symbols-outlined text-[16px] transition-all duration-200 ${isSelected ? 'opacity-100 w-auto ml-0 scale-100' : 'opacity-0 w-0 -ml-1 scale-0 overflow-hidden'}`}>check</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-body-lg font-semibold text-on-surface mb-0.5">Languages You Speak</label>
                    <p className="text-sm text-secondary">Helps us match you with a mentor for easier communication.</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {PRESET_LANGUAGES.map((lang) => {
                      const isSelected = languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleSelection(lang, languages, setLanguages)}
                          className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                            isSelected ? 'bg-tertiary text-on-tertiary shadow-sm scale-105' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                          }`}
                        >
                          <span>{lang}</span>
                          <span className={`material-symbols-outlined text-[16px] transition-all duration-200 ${isSelected ? 'opacity-100 w-auto ml-0 scale-100' : 'opacity-0 w-0 -ml-1 scale-0 overflow-hidden'}`}>check</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Goals & Hobbies */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-on-surface">Sports & Fitness</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_SPORTS.map((sport) => {
                        const isSelected = sportsInterests.includes(sport);
                        return (
                          <button
                            key={sport}
                            type="button"
                            onClick={() => toggleSelection(sport, sportsInterests, setSportsInterests)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                              isSelected ? 'bg-primary-container text-on-primary-container border-primary/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant border-transparent'
                            }`}
                          >
                            {sport}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-on-surface">Cultural Pursuits</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_CULT.map((cult) => {
                        const isSelected = cultInterests.includes(cult);
                        return (
                          <button
                            key={cult}
                            type="button"
                            onClick={() => toggleSelection(cult, cultInterests, setCultInterests)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                              isSelected ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant border-transparent'
                            }`}
                          >
                            {cult}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-on-surface">Hobbies & Activities</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_HOBBIES.map((hobby) => {
                        const isSelected = hobbies.includes(hobby);
                        return (
                          <button
                            key={hobby}
                            type="button"
                            onClick={() => toggleSelection(hobby, hobbies, setHobbies)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                              isSelected ? 'bg-primary-container text-on-primary-container border-primary/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant border-transparent'
                            }`}
                          >
                            {hobby}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-base font-semibold text-on-surface">Career/Academic Goals</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_GOALS.map((goal) => {
                        const isSelected = goals.includes(goal);
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => toggleSelection(goal, goals, setGoals)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                              isSelected ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant border-transparent'
                            }`}
                          >
                            {goal}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="p-4 border-t border-outline-variant/10 bg-surface/50 mt-auto flex justify-between items-center shrink-0">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || submitting}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold border border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container transition-colors shadow-sm ${currentStep === 1 ? 'invisible' : ''}`}
            >
              Previous
            </button>

            {currentStep < 3 ? (
              <button 
                onClick={handleNext} 
                className="bg-gradient-to-r from-primary to-indigo-500 hover:from-primary hover:to-indigo-400 text-white px-8 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all border border-primary/50 shadow-sm"
              >
                Next Step
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ) : (
              <button 
                onClick={handleSubmit} 
                disabled={submitting} 
                className="bg-gradient-to-r from-primary to-indigo-500 hover:from-primary hover:to-indigo-400 text-white px-8 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all border border-primary/50 shadow-sm disabled:opacity-70"
              >
                {submitting ? 'Submitting...' : 'Submit Profile'}
                {!submitting && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
