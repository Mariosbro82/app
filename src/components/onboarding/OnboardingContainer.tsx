import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import OnboardingWizard from './OnboardingWizard';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

interface OnboardingContainerProps {
  children: React.ReactNode;
}

const OnboardingContainer: React.FC<OnboardingContainerProps> = ({ children }) => {
  const { isCompleted, loadFromStorage, resetData } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(true);
  const [location] = useLocation();

  // Check if user explicitly wants onboarding
  const showOnboarding = location.includes('?onboarding=true') || location.includes('/onboarding');

  useEffect(() => {
    // Load saved onboarding data on mount
    const loadData = async () => {
      try {
        await loadFromStorage();
      } catch (error) {
        console.error('Failed to load onboarding data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadFromStorage]);

  // If user requests onboarding explicitly, show it
  useEffect(() => {
    if (showOnboarding && isCompleted) {
      resetData();
    }
  }, [showOnboarding]);

  // Show loading spinner while checking onboarding status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Lade Anwendung...</p>
        </div>
      </div>
    );
  }

  // Show onboarding wizard if not completed OR explicitly requested
  if (!isCompleted || showOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OnboardingWizard />
      </div>
    );
  }

  // Show main application if onboarding is completed
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
};

export default OnboardingContainer;