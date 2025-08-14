import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DomainSubmission from '../components/DomainSubmission';
import DomainExtraction from '../components/DomainExtraction';
import Step3Results from '../components/Step3Results';
import AIQueryResults, { AIQueryResult, AIQueryStats } from '../components/AIQueryResults';
import Step4Report from '../components/Step4Report';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [domain, setDomain] = useState('');
  const [subdomains, setSubdomains] = useState<string[]>([]);
  const [domainId, setDomainId] = useState<number>(0); 
  const [brandContext, setBrandContext] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [queryResults, setQueryResults] = useState<AIQueryResult[]>([]);
  const [queryStats, setQueryStats] = useState<AIQueryStats | null>(null);
  
  const [customPaths, setCustomPaths] = useState<string[]>([]);
  const [priorityUrls, setPriorityUrls] = useState<string[]>([]);
  const [priorityPaths, setPriorityPaths] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('');
  const [isSavingMain, setIsSavingMain] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const initializeOnboarding = async () => {
      const urlDomainId = searchParams.get('domainId');
      if (urlDomainId) {
        const domainIdNum = parseInt(urlDomainId);
        if (domainIdNum > 0) {
          setDomainId(domainIdNum);
        }
      }
    };

    initializeOnboarding();
  }, [searchParams]);

  useEffect(() => {
    console.log('Domain ID changed to:', domainId);
  }, [domainId]);

  const nextStep = async (passedDomainId?: number) => {
    if (currentStep < 4) {
      if (passedDomainId && passedDomainId > 0) {
        setDomainId(passedDomainId);
        console.log('Domain ID set from previous step:', passedDomainId);
      }
      
      console.log('Moving to next step. Current step:', currentStep, 'Domain ID:', domainId, 'Passed Domain ID:', passedDomainId);
      
      try {
        setCurrentStep(currentStep + 1);
      } catch (error) {
        console.error('Failed to save progress:', error);
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = async () => {
    if (currentStep > 0) {
      try {
        setCurrentStep(currentStep - 1);
      } catch (error) {
        console.error('Failed to save progress:', error);
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const completeAnalysis = async () => {
    setIsSavingMain(true);
    
    try {
      const dashboardUrl = `/dashboard/${domainId}`;
      navigate(dashboardUrl);
    } catch (error) {
      console.error('Failed to complete analysis:', error);
      setIsSavingMain(false);
    }
  };

  // Simplified steps with clean naming
  const steps = [
    'Domain',
    'Analysis',
    'Phrases',
    'Testing',
    'Report'
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin border-t-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-gray-900">Domain Analysis</h1>
              <p className="text-sm text-gray-500 mt-1">Step {currentStep + 1} of {steps.length}</p>
            </div>
            
            {/* Clean Step Progress */}
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    index < currentStep ? 'bg-gray-900 text-white' :
                    index === currentStep ? 'bg-gray-100 text-gray-900 ring-2 ring-gray-200' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-px mx-2 ${
                      index < currentStep ? 'bg-gray-900' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Minimal Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-1">
              <div 
                className="bg-gray-900 h-1 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Content Area */}
      <div className="max-w-6xl mx-auto">
        {currentStep === 0 && (
          <DomainSubmission
            domain={domain}
            setDomain={setDomain}
            onNext={nextStep}
            customPaths={customPaths}
            setCustomPaths={setCustomPaths}
            subdomains={subdomains}
            setSubdomains={setSubdomains}
            priorityUrls={priorityUrls}
            setPriorityUrls={setPriorityUrls}
            priorityPaths={priorityPaths}
            setPriorityPaths={setPriorityPaths}
            location={location}
            setLocation={setLocation}
          />
        )}
        
        {currentStep === 1 && (
          <DomainExtraction
            key={`domain-extraction-${domainId}`}
            domain={domain}
            subdomains={subdomains}
            setDomainId={setDomainId}
            domainId={domainId}
            setBrandContext={setBrandContext}
            onNext={nextStep}
            onPrev={prevStep}
            customPaths={customPaths}
            priorityUrls={priorityUrls}
            priorityPaths={priorityPaths}
            location={location}
          />
        )}
        
        {currentStep === 2 && (
          <Step3Results
            domainId={domainId}
            onNext={(data) => {
              nextStep();
            }}
            onBack={prevStep}
          />
        )}
        
        {currentStep === 3 && (
          <AIQueryResults
            domainId={domainId}
            setQueryResults={setQueryResults}
            setQueryStats={setQueryStats}
            onNext={nextStep}
            onPrev={prevStep}
            location={location}
          />
        )}

        {currentStep === 4 && (
          <Step4Report
            domainId={domainId}
            onBack={prevStep}
            onComplete={completeAnalysis}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
