import { OnboardingData, OnboardingExportData } from '../types/onboarding';

const STORAGE_KEY = 'pension_calculator_onboarding';
const VERSION = '1.0.0';

export class OnboardingStorageService {
  private static instance: OnboardingStorageService;
  private autoSaveEnabled = true;
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  static getInstance(): OnboardingStorageService {
    if (!OnboardingStorageService.instance) {
      OnboardingStorageService.instance = new OnboardingStorageService();
    }
    return OnboardingStorageService.instance;
  }

  // Check if localStorage is available
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Save data to localStorage
  saveData(data: Partial<OnboardingData>): void {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage is not available, skipping save');
      return;
    }

    try {
      const storageData = {
        ...data,
        version: VERSION,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      // Try to free up space by clearing old data
      try {
        this.clearData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...data,
          version: VERSION,
          lastSaved: new Date().toISOString()
        }));
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }
  }

  // Load data from localStorage
  loadData(): Partial<OnboardingData> | null {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage is not available, returning null');
      return null;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);

      // Version check - if version mismatch, return null to force re-onboarding
      if (data.version !== VERSION) {
        console.warn('Onboarding data version mismatch, clearing data');
        this.clearData();
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      // Clear corrupted data
      try {
        this.clearData();
      } catch (clearError) {
        console.error('Failed to clear corrupted data:', clearError);
      }
      return null;
    }
  }

  // Clear all onboarding data
  clearData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Also remove the legacy boolean flag to keep storage in sync
      localStorage.removeItem('onboarding-completed');
    } catch (error) {
      console.error('Failed to clear onboarding data:', error);
    }
  }

  // Check if onboarding is completed (single source of truth)
  // This checks the actual data for completedAt field
  // Accepts optional data parameter to avoid redundant loads
  isOnboardingCompleted(data?: Partial<OnboardingData> | null): boolean {
    const dataToCheck = data !== undefined ? data : this.loadData();
    // Return true only if completedAt exists and is a valid ISO string
    return dataToCheck?.completedAt !== undefined &&
           typeof dataToCheck.completedAt === 'string' &&
           dataToCheck.completedAt.length > 0;
  }

  // Mark onboarding as completed
  markCompleted(data: OnboardingData): void {
    const completedData = {
      ...data,
      completedAt: new Date().toISOString()
    };
    this.saveData(completedData);
  }

  // Static methods for easier access
  static saveData(data: Partial<OnboardingData>): void {
    OnboardingStorageService.getInstance().saveData(data);
  }

  static loadData(): Partial<OnboardingData> | null {
    return OnboardingStorageService.getInstance().loadData();
  }

  static clearData(): void {
    OnboardingStorageService.getInstance().clearData();
  }

  // Legacy method: kept for backward compatibility
  // Now delegates to the single source of truth (completedAt in data)
  static setCompleted(completed: boolean): void {
    console.warn('setCompleted() is deprecated. Use markCompleted() or update data with completedAt field.');
    try {
      if (completed) {
        // For backward compatibility, also set the flag
        localStorage.setItem('onboarding-completed', 'true');
      } else {
        localStorage.removeItem('onboarding-completed');
      }
    } catch (error) {
      console.error('Failed to set completion status:', error);
    }
  }

  // Delegates to the instance method for single source of truth
  static isCompleted(data?: Partial<OnboardingData> | null): boolean {
    return OnboardingStorageService.getInstance().isOnboardingCompleted(data);
  }

  // Auto-save with debouncing
  autoSave(data: Partial<OnboardingData>, delay = 1000): void {
    if (!this.autoSaveEnabled) return;

    // Clear existing timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    // Set new timeout
    this.autoSaveTimeout = setTimeout(() => {
      this.saveData(data);
    }, delay);
  }

  // Enable/disable auto-save
  setAutoSave(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
    if (!enabled && this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

  // Export data as JSON
  exportData(): OnboardingExport | null {
    const data = this.loadData();
    if (!data || !data.completedAt) return null;

    return {
      data: data as OnboardingData,
      exportedAt: new Date(),
      version: VERSION,
      checksum: this.generateChecksum(data)
    };
  }

  // Import data from JSON
  importData(exportData: OnboardingExport): boolean {
    try {
      // Validate checksum if present
      if (exportData.checksum) {
        const calculatedChecksum = this.generateChecksum(exportData.data);
        if (calculatedChecksum !== exportData.checksum) {
          console.error('Import failed: checksum mismatch');
          return false;
        }
      }

      // Version compatibility check
      if (exportData.version !== VERSION) {
        console.warn('Import data version mismatch, proceeding with caution');
      }

      this.saveData(exportData.data);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Generate simple checksum for data integrity
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const used = data ? new Blob([data]).size : 0;
      const available = 5 * 1024 * 1024; // Assume 5MB localStorage limit
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Backup data to download
  downloadBackup(): void {
    const exportData = this.exportData();
    if (!exportData) {
      console.error('No data to export');
      return;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pension-calculator-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Restore from uploaded file
  async restoreFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const exportData: OnboardingExport = JSON.parse(text);
      return this.importData(exportData);
    } catch (error) {
      console.error('Failed to restore from file:', error);
      return false;
    }
  }
}

// Export singleton instance
export const onboardingStorage = OnboardingStorageService.getInstance();