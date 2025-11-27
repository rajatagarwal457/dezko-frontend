import { VideoRender, VideoStatus } from '../types';

const STORAGE_KEY = 'vireo_video_renders';

export const videoStore = {
    /**
     * Save a new video render to localStorage
     */
    saveVideoRender(render: VideoRender): void {
        const renders = this.getVideoRenders(render.userId);
        renders.push(render);
        this._saveToStorage(renders);
    },

    /**
     * Get all video renders for a specific user
     */
    getVideoRenders(userId: string): VideoRender[] {
        const allRenders = this._loadFromStorage();
        return allRenders.filter(r => r.userId === userId);
    },

    /**
     * Update the status of a video render
     */
    updateVideoStatus(renderId: string, status: VideoStatus): void {
        const allRenders = this._loadFromStorage();
        const render = allRenders.find(r => r.id === renderId);
        if (render) {
            render.status = status;
            this._saveToStorage(allRenders);
        }
    },

    /**
     * Get a specific video render by ID
     */
    getVideoRender(renderId: string): VideoRender | undefined {
        const allRenders = this._loadFromStorage();
        return allRenders.find(r => r.id === renderId);
    },

    /**
     * Delete a video render
     */
    deleteVideoRender(renderId: string): void {
        const allRenders = this._loadFromStorage();
        const filtered = allRenders.filter(r => r.id !== renderId);
        this._saveToStorage(filtered);
    },

    /**
     * Internal: Load all renders from localStorage
     */
    _loadFromStorage(): VideoRender[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load video renders from storage:', error);
            return [];
        }
    },

    /**
     * Internal: Save all renders to localStorage
     */
    _saveToStorage(renders: VideoRender[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(renders));
        } catch (error) {
            console.error('Failed to save video renders to storage:', error);
        }
    }
};
