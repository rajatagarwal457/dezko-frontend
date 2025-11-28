import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { VideoRender } from '../types';
import { videoStore } from '../services/videoStore';
import { api } from '../services/api';
import { Film, Clock, CheckCircle, XCircle, Plus, Play } from 'lucide-react';
import Button from './Button';

interface DashboardViewProps {
    onCreateNew: () => void;
    onViewVideo: (render: VideoRender) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onCreateNew, onViewVideo }) => {
    const { user } = useUser();
    const [renders, setRenders] = useState<VideoRender[]>([]);
    const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user) {
            loadRenders();
        }
    }, [user]);

    const loadRenders = () => {
        if (!user) return;
        const userRenders = videoStore.getVideoRenders(user.id);
        // Sort by newest first
        userRenders.sort((a, b) => b.createdAt - a.createdAt);
        setRenders(userRenders);

        // Start polling for generating videos
        userRenders.forEach(render => {
            if (render.status === 'generating') {
                startPolling(render.id, render.filename, render.videoUrl);
            }
        });
    };

    const startPolling = (renderId: string, filename: string, videoUrl?: string) => {
        if (pollingIds.has(renderId)) return;

        setPollingIds(prev => new Set(prev).add(renderId));

        const pollInterval = setInterval(async () => {
            const status = await api.checkVideoStatus(filename, videoUrl);

            if (status.ready) {
                videoStore.updateVideoStatus(renderId, 'completed');
                // const _ = api.clearUploads();
                loadRenders();
                clearInterval(pollInterval);
                setPollingIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(renderId);
                    return newSet;
                });
            }
        }, 5000); // Poll every 5 seconds

        // Stop polling after 10 minutes (timeout)
        setTimeout(() => {
            clearInterval(pollInterval);
            setPollingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(renderId);
                return newSet;
            });
        }, 600000);
    };

    const getStatusBadge = (status: VideoRender['status']) => {
        switch (status) {
            case 'generating':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4 animate-spin" />
                        Generating
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Failed
                    </span>
                );
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-vireo-dark dark:text-white mb-2">
                        Your Videos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage and view all your Vireo creations
                    </p>
                </div>
                <Button onClick={onCreateNew} variant="primary" size="lg" className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create New
                </Button>
            </div>

            {/* Videos Grid */}
            {renders.length === 0 ? (
                <div className="text-center py-16">
                    <Film className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500 mb-2">
                        No videos yet
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 mb-6">
                        Start creating your first Vireo story!
                    </p>
                    <Button onClick={onCreateNew} variant="primary">
                        Create Your First Video
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renders.map(render => (
                        <div
                            key={render.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 hover:border-vireo-teal dark:hover:border-vireo-teal transition-all duration-300 shadow-sm hover:shadow-xl"
                        >
                            {/* Thumbnail/Preview */}
                            <div className="aspect-video bg-gradient-to-br from-vireo-teal/20 to-vireo-purple/20 dark:from-vireo-teal/10 dark:to-vireo-purple/10 flex items-center justify-center relative group">
                                <Film className="w-12 h-12 text-vireo-teal opacity-50" />
                                {render.status === 'completed' && (
                                    <button
                                        onClick={() => onViewVideo(render)}
                                        className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center"
                                    >
                                        <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-vireo-dark dark:text-white mb-1 truncate">
                                            {render.clipNames.join(', ') || 'Untitled Video'}
                                        </h3>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {formatDate(render.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    {getStatusBadge(render.status)}

                                    {render.status === 'completed' && (
                                        <button
                                            onClick={() => onViewVideo(render)}
                                            className="text-vireo-teal hover:text-vireo-purple font-bold text-sm transition-colors"
                                        >
                                            View →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardView;
