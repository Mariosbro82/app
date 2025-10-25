import { create } from 'zustand';
import { OnboardingData, WizardStep, PersonalData, IncomeData, PensionData, AssetData, MortgageData, OnboardingExportData, ValidationErrors, PrivatePensionData, RiesterData, RuerupData, OccupationalPensionData, LifeInsuranceData, FundsData, SavingsData, OtherIncomeData } from '../types/onboarding';
import { OnboardingStorageService } from '../services/onboardingStorage';

interface OnboardingStore {
  // State
  currentStep: WizardStep;
  data: OnboardingData;
  errors: ValidationErrors;
  isCompleted: boolean;
  
  // Actions
  setCurrentStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  previousStep: () => void;
  
  // Getters
  getCurrentStep: () => { id: WizardStep; title: string; description?: string };
  getProgress: () => number;
  isLastStep: () => boolean;
  isFirstStep: () => boolean;
  canProceed: () => boolean;
  getTotalSteps: () => number;
  
  // Initialization
  initializeOnboarding: () => void;
  resetOnboarding: () => void;
  updatePersonalData: (data: Partial<PersonalData>) => void;
  updateData: (data: Partial<OnboardingData>) => void;
  updateIncomeData: (data: { income?: Partial<IncomeData>; otherIncome?: Partial<OtherIncomeData> }) => void;
  updateOtherIncomeData: (data: Partial<OtherIncomeData>) => void;
  updatePensionData: (data: Partial<PensionData>) => void;
  updatePensionsData: (data: Partial<PensionData>) => void;
  updatePrivatePensionData: (data: Partial<PrivatePensionData>) => void;
  updateRiesterData: (data: Partial<RiesterData>) => void;
  updateRuerupData: (data: Partial<RuerupData>) => void;
  updateOccupationalPensionData: (data: Partial<OccupationalPensionData>) => void;
  updateLifeInsuranceData: (data: Partial<LifeInsuranceData>) => void;
  updateFundsData: (data: Partial<FundsData>) => void;
  updateSavingsData: (data: Partial<SavingsData>) => void;
  updateMortgageData: (data: Partial<MortgageData>) => void;
  updateRetirementData: (data: { privatePension?: Partial<PrivatePensionData>; riester?: Partial<RiesterData>; ruerup?: Partial<RuerupData>; occupationalPension?: Partial<OccupationalPensionData> }) => void;
  updateAssetsData: (data: { lifeInsurance?: Partial<LifeInsuranceData>; funds?: Partial<FundsData>; savings?: Partial<SavingsData> }) => void;
  validateCurrentStep: () => boolean;
  completeOnboarding: () => void;
  resetData: () => void;
  exportData: () => OnboardingExportData;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => void;
  importData: (importedData: OnboardingExportData) => { success: boolean; error?: string };
}

const initialData: OnboardingData = {
  personal: {
    children: { has: false, count: 0 }
  },
  income: {},
  otherIncome: { has: false },
  pensions: {},
  privatePension: {},
  riester: {},
  ruerup: {},
  occupationalPension: {},
  lifeInsurance: {},
  funds: {},
  savings: {},
  mortgage: { has: false }
};

const steps: WizardStep[] = ['personal', 'income', 'pensions', 'retirement', 'assets', 'mortgage', 'summary'];

const stepDefinitions = {
  personal: {
    id: 'personal' as WizardStep,
    title: 'Persönliche Angaben',
    description: 'Grundlegende Informationen zu Ihrer Person und Familie'
  },
  income: {
    id: 'income' as WizardStep,
    title: 'Einkommen',
    description: 'Ihr monatliches Nettoeinkommen und weitere Einkünfte'
  },
  pensions: {
    id: 'pensions' as WizardStep,
    title: 'Gesetzliche Renten',
    description: 'Ihre voraussichtlichen Renten aus gesetzlichen Systemen'
  },
  retirement: {
    id: 'retirement' as WizardStep,
    title: 'Private Altersvorsorge',
    description: 'Riester, Rürup und betriebliche Altersvorsorge'
  },
  assets: {
    id: 'assets' as WizardStep,
    title: 'Vermögen',
    description: 'Lebensversicherungen, Fonds und Sparguthaben'
  },
  mortgage: {
    id: 'mortgage' as WizardStep,
    title: 'Immobilienfinanzierung',
    description: 'Angaben zu bestehenden Immobilienkrediten'
  },
  summary: {
    id: 'summary' as WizardStep,
    title: 'Zusammenfassung',
    description: 'Überprüfen Sie Ihre Angaben vor dem Abschluss'
  }
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // Initial state
  currentStep: 'personal',
  data: initialData,
  errors: {},
  isCompleted: false,

  // Actions
  setCurrentStep: (step) => {
    set({ currentStep: step });
  },

  nextStep: () => {
    const { currentStep, validateCurrentStep } = get();
    if (validateCurrentStep()) {
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        set({ currentStep: steps[currentIndex + 1] });
      }
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: steps[currentIndex - 1] });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: steps[currentIndex - 1] });
    }
  },

  // Getters
  getCurrentStep: () => {
    const { currentStep } = get();
    return stepDefinitions[currentStep];
  },

  getProgress: () => {
    const { currentStep } = get();
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  },

  isLastStep: () => {
    const { currentStep } = get();
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex === steps.length - 1;
  },

  isFirstStep: () => {
    const { currentStep } = get();
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex === 0;
  },

  canProceed: () => {
    const { validateCurrentStep } = get();
    return validateCurrentStep();
  },

  getTotalSteps: () => {
    return steps.length;
  },

  // Initialization
  initializeOnboarding: () => {
    const { loadFromStorage } = get();
    loadFromStorage();
  },

  resetOnboarding: () => {
    const { resetData } = get();
    resetData();
  },

  updatePersonalData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      personal: { ...data.personal, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateData: (newData) => {
    const { data } = get();
    const updatedData = { ...data, ...newData };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateIncomeData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      income: { ...data.income, ...newData.income },
      otherIncome: { ...data.otherIncome, ...newData.otherIncome }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateOtherIncomeData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      otherIncome: { ...data.otherIncome, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updatePensionsData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      pensions: { ...data.pensions, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updatePensionData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      pensions: { ...data.pensions, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateRetirementData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      privatePension: { ...data.privatePension, ...newData.privatePension },
      riester: { ...data.riester, ...newData.riester },
      ruerup: { ...data.ruerup, ...newData.ruerup },
      occupationalPension: { ...data.occupationalPension, ...newData.occupationalPension }
    };

    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);

    set({ data: updatedData });
  },

  updateAssetsData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      lifeInsurance: { ...data.lifeInsurance, ...newData.lifeInsurance },
      funds: { ...data.funds, ...newData.funds },
      savings: { ...data.savings, ...newData.savings }
    };

    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);

    set({ data: updatedData });
  },

  updatePrivatePensionData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      privatePension: { ...data.privatePension, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateRiesterData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      riester: { ...data.riester, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateRuerupData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      ruerup: { ...data.ruerup, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateOccupationalPensionData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      occupationalPension: { ...data.occupationalPension, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateLifeInsuranceData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      lifeInsurance: { ...data.lifeInsurance, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateFundsData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      funds: { ...data.funds, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateSavingsData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      savings: { ...data.savings, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  updateMortgageData: (newData) => {
    const { data } = get();
    const updatedData = {
      ...data,
      mortgage: { ...data.mortgage, ...newData }
    };
    
    // Auto-save to storage
    OnboardingStorageService.saveData(updatedData);
    
    set({ data: updatedData });
  },

  validateCurrentStep: () => {
    const { currentStep, data } = get();
    
    switch (currentStep) {
      case 'personal':
        return !!(data.personal.birthYear && data.personal.maritalStatus);
      case 'income':
        return !!(data.income.netMonthly && data.income.netMonthly > 0);
      case 'pensions':
        return true; // Optional fields
      case 'retirement':
        return true; // Optional fields
      case 'assets':
        return true; // Optional fields
      case 'mortgage':
        return true; // Optional fields
      case 'summary':
        return true;
      default:
        return false;
    }
  },

  completeOnboarding: () => {
    const { data } = get();
    const completedData = { ...data, completedAt: new Date().toISOString() };

    // Save completion status (completedAt in data is the single source of truth)
    OnboardingStorageService.saveData(completedData);

    set({
      data: completedData,
      isCompleted: true
    });
  },

  resetData: () => {
    // Clear storage
    OnboardingStorageService.clearData();
    
    set({
      currentStep: 'personal',
      data: initialData,
      errors: {},
      isCompleted: false
    });
  },

  exportData: () => {
    const { data } = get();
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data
    };
  },

  loadFromStorage: async () => {
    try {
      const storedData = OnboardingStorageService.loadData();
      const isCompleted = OnboardingStorageService.isCompleted();
      
      if (storedData) {
        set({ 
          data: { ...initialData, ...storedData },
          isCompleted 
        });
      } else {
        set({ 
          data: initialData,
          isCompleted: false 
        });
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      set({ 
        data: initialData,
        isCompleted: false 
      });
    }
  },

  saveToStorage: () => {
    const { data } = get();
    OnboardingStorageService.saveData(data);
  },

  importData: (importedData: OnboardingExportData) => {
    try {
      if (importedData.version !== '1.0') {
        throw new Error('Unsupported data version');
      }
      
      set({ 
        data: importedData.data,
        currentStep: 'summary'
      });
      
      // Save to storage
      OnboardingStorageService.saveData(importedData.data);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed' 
      };
    }
  }
}));