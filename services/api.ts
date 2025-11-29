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
    async getUploadUrl(sessionId: string, filename: string, contentType: string): Promise<{ upload_url: string; key: string }> {
        const response = await fetch(`${API_BASE_URL}/get-upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: sessionId,
                filename: filename,
                content_type: contentType
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get upload URL: ${response.statusText}`);
        }

        return response.json();
    },

    async uploadVideos(files: File[], userId: string): Promise<{ message: string; files: string[]; session_id: string }> {
        // 1. Generate Session ID: {userId}-{uuid}
        const uuid = crypto.randomUUID();
        const sessionId = `${userId}-${uuid}`;

        // 2. Upload each file using Presigned URL
        const uploadPromises = files.map(async (file) => {
            const filename = file.name;

            // A. Get Presigned URL from Backend
            const { upload_url } = await this.getUploadUrl(sessionId, filename, file.type);

            // B. Upload directly to S3 using the signed URL
            const response = await fetch(upload_url, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            if (!response.ok) {
                throw new Error(`Upload failed for ${filename}: ${response.statusText}`);
            }

            return filename;
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        return {
            message: "Uploads successful",
            files: uploadedFiles,
            session_id: sessionId
        };
    },

    async generateVideo(sessionId: string, fileNames: string[]): Promise<GenerateResponse> {
        const body = {
            sessionId: sessionId,
            fileNames: fileNames
        };
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
