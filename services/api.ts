const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface Song {
    id: string;
    name: string;
    artist: string;
    duration: string;
    audioFile: string;
    beatsFile: string;
}

export interface GenerateResponse {
    status: string;
    video_url: string;
    filename: string;
}

export const api = {
    async uploadVideos(files: File[]): Promise<{ message: string; files: string[]; session_id: string }> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return response.json();
    },

    async generateVideo(sessionId: string): Promise<GenerateResponse> {
        const body = { session_id: sessionId };
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(error.detail || 'Video generation failed');
        }

        return response.json();
    },

    async logError(error: Error): Promise<{ message: string }> {
        const body = { error: error.message };
        const response = await fetch(`${API_BASE_URL}/error`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Error logging failed: ${response.statusText}`);
        }

        return response.json();
    },

    async getSongs(): Promise<Song[]> {
        const response = await fetch(`${API_BASE_URL}/songs`);

        if (!response.ok) {
            throw new Error(`Failed to fetch songs: ${response.statusText}`);
        }

        return response.json();
    },

    async clearUploads(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/clear`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Clear failed: ${response.statusText}`);
        }

        return response.json();
    },

    async checkVideoStatus(filename: string, url?: string): Promise<{ exists: boolean; ready: boolean }> {
        try {
            const videoUrl = url || this.getVideoUrl(filename);
            const response = await fetch(videoUrl, { method: 'HEAD' });
            return {
                exists: response.ok,
                ready: response.ok
            };
        } catch (error) {
            return { exists: false, ready: false };
        }
    },

    getVideoUrl(filename: string): string {
        return `${API_BASE_URL}/outputs/${filename}`;
    },
};
