import { UserQuota } from '../types';
import { FREE_GENERATION_LIMIT } from '../constants';

const QUOTA_STORAGE_KEY = 'vireo_user_quotas';

export const quotaStore = {
    /**
     * Get quota for a specific user
     */
    getUserQuota(userId: string): UserQuota {
        const quotas = this._loadFromStorage();
        const existing = quotas.find(q => q.userId === userId);

        if (existing) {
            return existing;
        }

        // Create new quota for first-time user
        const newQuota: UserQuota = {
            userId,
            generationCount: 0,
            isPremium: false
        };
        quotas.push(newQuota);
        this._saveToStorage(quotas);
        return newQuota;
    },

    /**
     * Check if user can generate a video (has free tries or is premium)
     */
    canGenerate(userId: string): boolean {
        const quota = this.getUserQuota(userId);
        return quota.isPremium || quota.generationCount < FREE_GENERATION_LIMIT;
    },

    /**
     * Get remaining free generations for user
     */
    getRemainingGenerations(userId: string): number {
        const quota = this.getUserQuota(userId);
        if (quota.isPremium) return Infinity;
        return Math.max(0, FREE_GENERATION_LIMIT - quota.generationCount);
    },

    /**
     * Increment generation count after successful video generation
     */
    incrementGenerationCount(userId: string): UserQuota {
        const quotas = this._loadFromStorage();
        const quota = quotas.find(q => q.userId === userId);

        if (quota) {
            quota.generationCount += 1;
            this._saveToStorage(quotas);
            return quota;
        }

        // Should not happen, but handle gracefully
        const newQuota: UserQuota = {
            userId,
            generationCount: 1,
            isPremium: false
        };
        quotas.push(newQuota);
        this._saveToStorage(quotas);
        return newQuota;
    },

    /**
     * Upgrade user to premium after successful payment
     */
    upgradeToPremium(userId: string): UserQuota {
        const quotas = this._loadFromStorage();
        let quota = quotas.find(q => q.userId === userId);

        if (quota) {
            quota.isPremium = true;
            quota.premiumSince = Date.now();
        } else {
            quota = {
                userId,
                generationCount: 0,
                isPremium: true,
                premiumSince: Date.now()
            };
            quotas.push(quota);
        }

        this._saveToStorage(quotas);
        return quota;
    },

    /**
     * Sync quota from backend (for cross-device consistency)
     */
    syncFromBackend(userId: string, backendQuota: { generationCount: number; isPremium: boolean }): UserQuota {
        const quotas = this._loadFromStorage();
        let quota = quotas.find(q => q.userId === userId);

        if (quota) {
            // Take the higher generation count to prevent abuse
            quota.generationCount = Math.max(quota.generationCount, backendQuota.generationCount);
            // If premium on backend, sync it
            if (backendQuota.isPremium && !quota.isPremium) {
                quota.isPremium = true;
                quota.premiumSince = Date.now();
            }
        } else {
            quota = {
                userId,
                generationCount: backendQuota.generationCount,
                isPremium: backendQuota.isPremium,
                premiumSince: backendQuota.isPremium ? Date.now() : undefined
            };
            quotas.push(quota);
        }

        this._saveToStorage(quotas);
        return quota;
    },

    /**
     * Internal: Load all quotas from localStorage
     */
    _loadFromStorage(): UserQuota[] {
        try {
            const data = localStorage.getItem(QUOTA_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load quotas from storage:', error);
            return [];
        }
    },

    /**
     * Internal: Save all quotas to localStorage
     */
    _saveToStorage(quotas: UserQuota[]): void {
        try {
            localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(quotas));
        } catch (error) {
            console.error('Failed to save quotas to storage:', error);
        }
    }
};
