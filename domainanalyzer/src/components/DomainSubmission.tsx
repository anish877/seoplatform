import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Globe, Shield, TrendingUp, Plus, Upload, ArrowRight, MapPin, Settings, Info, Lightbulb } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import { City, Country, State } from 'country-state-city';
import type { CSSObjectWithLabel } from 'react-select';

interface DomainSubmissionProps {
  domain: string;
  setDomain: (domain: string) => void;
  onNext: (domainId?: number) => void;
  customPaths?: string[];
  setCustomPaths?: (paths: string[]) => void;
  subdomains?: string[];
  setSubdomains?: (subdomains: string[]) => void;
  priorityUrls?: string[];
  setPriorityUrls?: (urls: string[]) => void;
  priorityPaths?: string[];
  setPriorityPaths?: (paths: string[]) => void;
  location?: string;
  setLocation?: (location: string) => void;
}

interface DomainCheckResult {
  exists: boolean;
  domainId?: number;
  url?: string;
  hasCurrentAnalysis?: boolean;
  lastAnalyzed?: string;
}

const DomainSubmission: React.FC<DomainSubmissionProps> = ({ 
  domain, 
  setDomain, 
  onNext,
  customPaths: customPathsProp,
  setCustomPaths: setCustomPathsProp,
  subdomains,
  setSubdomains,
  priorityUrls: priorityUrlsProp,
  setPriorityUrls: setPriorityUrlsProp,
  priorityPaths: priorityPathsProp,
  setPriorityPaths: setPriorityPathsProp,
  location: locationProp,
  setLocation: setLocationProp
}) => {
  const [customPaths, setCustomPathsState] = useState<string[]>(customPathsProp || []);
  const [priorityUrls, setPriorityUrlsState] = useState<string[]>(priorityUrlsProp || []);
  const [priorityPaths, setPriorityPathsState] = useState<string[]>(priorityPathsProp || []);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<{ value: string; label: string } | null>(null);
  const [selectedState, setSelectedState] = useState<{ value: string; label: string } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{ value: string; label: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customKeywords, setCustomKeywords] = useState('');
  const [intentPhrases, setIntentPhrases] = useState('');
  const [chatModel, setChatModel] = useState('GPT-4o');
  const [runAllModels, setRunAllModels] = useState(false);
  const [domainError, setDomainError] = useState('');
  const [loadingSteps, setLoadingSteps] = useState([
    { name: 'Domain Validation', status: 'pending', progress: 0 },
    { name: 'SSL Certificate Check', status: 'pending', progress: 0 },
    { name: 'Server Response Analysis', status: 'pending', progress: 0 },
    { name: 'Geo-location Configuration', status: 'pending', progress: 0 }
  ]);

  // Carousel control state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const chatModels = ['GPT-4o', 'Claude 3', 'Gemini 1.5'];
  const [location, setLocationState] = useState<string>(locationProp || '');

  // Get real country, state, and city data
  const countryOptions = Country.getAllCountries().map(country => ({
    value: country.isoCode,
    label: country.name
  }));

  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.value).map(state => ({
        value: state.isoCode,
        label: state.name
      }))
    : [];

  const cityOptions = selectedState && selectedCountry
    ? City.getCitiesOfState(selectedCountry.value, selectedState.value).map(city => ({
        value: city.name,
        label: city.name
      }))
    : [];

  // Sync with parent state
  useEffect(() => {
    if (setCustomPathsProp) setCustomPathsProp(customPaths);
    if (setPriorityUrlsProp) setPriorityUrlsProp(priorityUrls);
    if (setPriorityPathsProp) setPriorityPathsProp(priorityPaths);
    if (setLocationProp) setLocationProp(location);
  }, [customPaths, priorityUrls, priorityPaths, setCustomPathsProp, setPriorityUrlsProp, setPriorityPathsProp, location, setLocationProp]);

  // Update location state when location fields are selected
  useEffect(() => {
    const locationParts = [];
    if (selectedCity) locationParts.push(selectedCity.label);
    if (selectedState) locationParts.push(selectedState.label);
    if (selectedCountry) locationParts.push(selectedCountry.label);
    
    setLocationState(locationParts.join(', '));
  }, [selectedCountry, selectedState, selectedCity]);

  // Auto-advance carousel to show running task
  useEffect(() => {
    const interval = setInterval(() => {
      const runningTaskIndex = loadingSteps.findIndex(task => task.status === 'running');
      if (runningTaskIndex !== -1) {
        setCurrentTaskIndex(runningTaskIndex);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [loadingSteps]);

  const validateDomain = (value: string) => {
    const domainRegex = /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!value) {
      setDomainError('Domain is required');
      return false;
    }
    if (!domainRegex.test(value)) {
      setDomainError('Please enter a valid domain (e.g., example.com)');
      return false;
    }
    setDomainError('');
    return true;
  };

  const handleDomainChange = (value: string) => {
    setDomain(value);
    if (value) validateDomain(value);
  };

  const checkDomain = async (): Promise<DomainCheckResult | null> => {
    if (!domain.trim()) {
      toast({
        title: "Domain required",
        description: "Please enter a domain",
        variant: "destructive"
      });
      return null;
    }

    if (!validateDomain(domain.trim())) {
      return null;
    }

    // Don't show loading state for domain check - it should be silent
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/domain/check/${encodeURIComponent(domain.trim())}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      const result: DomainCheckResult = await response.json();
      
      // Don't show toast messages for domain check - they will be shown in handleSubmit
      return result;
    } catch (error) {
      console.error('Error checking domain:', error);
      toast({
        title: "Error",
        description: "Failed to check domain status",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDomain(domain) || !selectedCountry) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate advanced filters if shown
    if (showAdvanced) {
      const keywords = customKeywords.split(',').map(k => k.trim()).filter(k => k);
      const phrases = intentPhrases.split(',').map(p => p.trim()).filter(p => p);

      if (keywords.length > 5 || phrases.length > 5) {
        toast({
          title: "Too many items",
          description: "Maximum 5 items allowed for keywords and phrases",
          variant: "destructive"
        });
        return;
      }
    }

    // First check if domain exists BEFORE showing any loading
    console.log('Checking domain existence before proceeding...');
    const domainCheck = await checkDomain();
    if (!domainCheck) {
      return;
    }

    // If domain already exists, proceed directly without any loading
    if (domainCheck.exists && domainCheck.domainId) {
      console.log('Existing domain found, proceeding directly with domainId:', domainCheck.domainId);
      
      // Show success message
      toast({
        title: "Domain Found",
        description: "Continuing with existing domain analysis",
      });
      
      // Proceed directly to next step with existing domain ID
      onNext(domainCheck.domainId);
      return;
    }

    // For new domains, show loading and run validation steps
    console.log('New domain detected, starting validation process...');
    setIsLoading(true);

    // Run step-by-step validation for new domains only
    const steps = [...loadingSteps];
    let domainId: number | null = null;
    
    try {
      // Step 1: Domain Validation
      steps[0] = { ...steps[0], status: 'running' };
      setLoadingSteps([...steps]);
      
      for (let progress = 0; progress <= 100; progress += 20) {
        steps[0] = { ...steps[0], progress };
        setLoadingSteps([...steps]);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const validationResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/domain-validation/validate-domain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain })
      });
      
      const validationResult = await validationResponse.json();
      
      if (!validationResult.success) {
        steps[0] = { ...steps[0], status: 'failed', progress: 100 };
        setLoadingSteps([...steps]);
        toast({
          title: "Domain Validation Failed",
          description: validationResult.error,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      steps[0] = { ...steps[0], status: 'completed', progress: 100 };
      setLoadingSteps([...steps]);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: SSL Certificate Check
      steps[1] = { ...steps[1], status: 'running' };
      setLoadingSteps([...steps]);
      
      for (let progress = 0; progress <= 100; progress += 20) {
        steps[1] = { ...steps[1], progress };
        setLoadingSteps([...steps]);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const sslResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/domain-validation/check-ssl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain })
      });
      
      const sslResult = await sslResponse.json();
      
      if (!sslResult.success) {
        steps[1] = { ...steps[1], status: 'failed', progress: 100 };
        setLoadingSteps([...steps]);
        toast({
          title: "SSL Check Failed",
          description: sslResult.error,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      steps[1] = { ...steps[1], status: 'completed', progress: 100 };
      setLoadingSteps([...steps]);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Server Response Analysis
      steps[2] = { ...steps[2], status: 'running' };
      setLoadingSteps([...steps]);
      
      for (let progress = 0; progress <= 100; progress += 20) {
        steps[2] = { ...steps[2], progress };
        setLoadingSteps([...steps]);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const serverResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/domain-validation/analyze-server`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain })
      });
      
      const serverResult = await serverResponse.json();
      
      if (!serverResult.success) {
        steps[2] = { ...steps[2], status: 'failed', progress: 100 };
        setLoadingSteps([...steps]);
        toast({
          title: "Server Analysis Failed",
          description: serverResult.error,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      steps[2] = { ...steps[2], status: 'completed', progress: 100 };
      setLoadingSteps([...steps]);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 4: Geo-location Configuration with AI Analysis (This creates the domain in DB)
      steps[3] = { ...steps[3], status: 'running' };
      setLoadingSteps([...steps]);
      
      for (let progress = 0; progress <= 100; progress += 20) {
        steps[3] = { ...steps[3], progress };
        setLoadingSteps([...steps]);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const geoResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/domain-validation/configure-geo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          domain, 
          location, 
          customKeywords, 
          intentPhrases, 
          chatModel, 
          runAllModels 
        })
      });
      
      const geoResult = await geoResponse.json();
      
      if (!geoResult.success) {
        steps[3] = { ...steps[3], status: 'failed', progress: 100 };
        setLoadingSteps([...steps]);
        toast({
          title: "Geo-location Configuration Failed",
          description: geoResult.error,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      domainId = geoResult.domainId;
      steps[3] = { ...steps[3], status: 'completed', progress: 100 };
      setLoadingSteps([...steps]);
      await new Promise(resolve => setTimeout(resolve, 300));

      // All steps completed successfully
      toast({
        title: "Domain Setup Complete",
        description: "All validation steps completed successfully",
      });

      // Proceed to next step with new domain ID
      onNext(domainId);
      
    } catch (error) {
      console.error('Error during domain validation:', error);
      toast({
        title: "Validation Error",
        description: "An error occurred during domain validation",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectMenuPortalTarget = typeof window !== 'undefined' ? document.body : undefined;
  const selectStyles = {
    menuPortal: (base: CSSObjectWithLabel, _props: unknown): CSSObjectWithLabel => ({ ...base, zIndex: 9999 }),
    control: (base: CSSObjectWithLabel) => ({ 
      ...base, 
      minHeight: '48px', 
      fontSize: '14px',
      borderColor: '#d1d5db',
      '&:hover': {
        borderColor: '#3b82f6'
      },
      '&:focus-within': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
      }
    }),
    option: (base: CSSObjectWithLabel, state: { isSelected?: boolean; isFocused?: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3b82f6' : '#eff6ff'
      }
    }),
    placeholder: (base: CSSObjectWithLabel) => ({
      ...base,
      color: '#9ca3af'
    })
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Domain Setup in Progress</h2>
          
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Target Domain: {domain}</span>
              <span className="text-sm text-blue-600">{selectedCountry?.label}</span>
            </div>
            {customKeywords && (
              <div className="text-sm text-blue-700">
                Focus Keywords: {customKeywords}
              </div>
            )}
          </div>

          <div className="py-16">
            {/* Minimal Spinner */}
            <div className="flex justify-center mb-8">
              <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-gray-800"></div>
            </div>

            {/* Carousel Container with Smooth Transitions */}
            <div className="relative h-20 mb-12 overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentTaskIndex * 100}%)` }}
              >
                {loadingSteps.map((task, index) => (
                  <div key={index} className="w-full flex-shrink-0 text-center">
                    <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                      {task.name}
                    </h3>
                    <p className="text-gray-500 text-sm transition-opacity duration-500">
                      {task.status === 'completed' ? 'Completed successfully' : 
                       task.status === 'running' ? 'In progress...' : 'Pending'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimal Progress Dots */}
            <div className="flex justify-center space-x-2">
              {loadingSteps.map((task, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${
                    task.status === 'completed'
                      ? 'bg-gray-800 scale-110'
                      : index === currentTaskIndex
                      ? 'bg-gray-600 scale-125'
                      : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600">
              <Shield className="w-5 h-5 flex items-center justify-center mr-2" />
              <span className="text-sm">Your data is being securely processed and encrypted</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">Domain Analysis</h2>
        <p className="text-gray-500">Enter your domain and location to begin</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Domain Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Domain
            </label>
            <div className="relative">
              <input
                type="text"
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                placeholder="example.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-colors ${
                  domainError ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {domainError && <p className="text-red-500 text-sm mt-2">{domainError}</p>}
          </div>

          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Target Location
            </label>
            <select
              value={selectedCountry?.value || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const country = countryOptions.find(c => c.value === e.target.value);
                setSelectedCountry(country || null);
                setSelectedState(null);
                setSelectedCity(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none"
              required
            >
              <option value="">Select country</option>
              {countryOptions.map(country => (
                <option key={country.value} value={country.value}>{country.label}</option>
              ))}
            </select>
          </div>

          {/* Optional State/City - Only show if country is selected */}
          {selectedCountry && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={selectedState?.value || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const state = stateOptions.find(s => s.value === e.target.value);
                    setSelectedState(state || null);
                    setSelectedCity(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none text-sm"
                >
                  <option value="">Optional</option>
                  {stateOptions.map(state => (
                    <option key={state.value} value={state.value}>{state.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  value={selectedCity?.value || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const city = cityOptions.find(c => c.value === e.target.value);
                    setSelectedCity(city || null);
                  }}
                  disabled={!selectedState}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none text-sm disabled:opacity-50"
                >
                  <option value="">Optional</option>
                  {cityOptions.map(city => (
                    <option key={city.value} value={city.value}>{city.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Advanced Options - Simplified */}
          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              Advanced Options
              <ArrowRight className={`w-4 h-4 ml-2 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(e.target.value)}
                    placeholder="keyword1, keyword2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intent Phrases
                  </label>
                  <input
                    type="text"
                    value={intentPhrases}
                    onChange={(e) => setIntentPhrases(e.target.value)}
                    placeholder="how to, best way to"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none text-sm"
                  >
                    {chatModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={runAllModels}
                    onChange={(e) => setRunAllModels(e.target.checked)}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="ml-2 text-sm text-gray-700">Run all models</span>
                </label>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start Analysis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DomainSubmission;
