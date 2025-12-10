import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Moon, Sun, LayoutDashboard } from 'lucide-react';
import { AppState, UploadedClip, VideoRender, UserQuota } from '../types';
import LandingView from '../components/LandingView';
import ProcessingView from '../components/ProcessingView';
import ResultView from '../components/ResultView';
import DashboardView from '../components/DashboardView';
import VireoBird from '../components/VireoBird';
import PaymentModal from '../components/PaymentModal';
import QuotaIndicator from '../components/QuotaIndicator';
import { api } from '../services/api';
import { videoStore } from '../services/videoStore';
import { quotaStore } from '../services/quotaStore';

const App: React.FC = () => {
  const { isSignedIn, isLoaded, user } = useUser();
  const [currentState, setCurrentState] = useState<AppState>(AppState.LANDING);
  const [uploadedClips, setUploadedClips] = useState<UploadedClip[]>([]);
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentRender, setCurrentRender] = useState<VideoRender | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);

  // Quota state
  const [userQuota, setUserQuota] = useState<UserQuota | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Initialize and sync quota when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Load local quota
      const localQuota = quotaStore.getUserQuota(user.id);
      setUserQuota(localQuota);

      // Sync with backend (async, non-blocking)
      api.getUserQuota(user.id).then(backendQuota => {
        const syncedQuota = quotaStore.syncFromBackend(user.id, backendQuota);
        setUserQuota(syncedQuota);
      }).catch(err => {
        console.error('Failed to sync quota from backend:', err);
      });
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleStartProcessing = async (
    sessionIdOrPromise: string | Promise<{ session_id: string; files: string[] }>,
    fileNames: string[],
    clipNames: string[],
    vibe?: string
  ) => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      alert("Please sign in to upload videos.");
      return;
    }
    setIsProcessing(true);
    setCurrentState(AppState.PROCESSING);

    // Upload already happened in LandingView, skip directly to generation
    (async () => {
      try {
        // Wait for upload if it's a promise
        let sessionId: string;
        let actualFileNames: string[];

        if (typeof sessionIdOrPromise === 'string') {
          sessionId = sessionIdOrPromise;
          actualFileNames = fileNames;
        } else {
          const uploadData = await sessionIdOrPromise;
          sessionId = uploadData.session_id;
          actualFileNames = uploadData.files;
        }

        // Generate Video (backend returns immediately with filename)
        const result = await api.generateVideo(sessionId, actualFileNames, vibe);

        // Increment generation count after successful generation


        // Save render with actual filename
        const baseRender: VideoRender = {
          id: result.filename,
          filename: result.filename,
          status: 'generating',
          createdAt: Date.now(),
          clipNames: clipNames,
          userId: user.id,
          videoUrl: result.video_url
        };
        videoStore.saveVideoRender(baseRender);
        setCurrentRender(baseRender);
        setCurrentFilename(result.filename);

        // Poll until the output video is actually available
        const pollIntervalMs = 3000;
        const maxAttempts = 40; // ~2 minutes
        let attempts = 0;

        const pollForReady = async () => {
          attempts += 1;
          try {
            const status = await api.checkVideoStatus(result.filename, result.video_url);
            if (status.ready) {
              const completedRender: VideoRender = {
                ...baseRender,
                status: 'completed',
                videoUrl: result.video_url || baseRender.videoUrl,
              };
              const updatedQuota = quotaStore.incrementGenerationCount(user.id);
              setUserQuota(updatedQuota);
              // Sync to backend
              api.syncQuota(user.id, updatedQuota.generationCount);
              videoStore.saveVideoRender(completedRender);
              setCurrentRender(completedRender);
              setOutputVideoUrl(completedRender.videoUrl || api.getVideoUrl(completedRender.filename));
              setIsProcessing(false);
              setCurrentState(AppState.RESULT);
              return;
            }
          } catch (err) {
            console.error('Error checking video status', err);
          }

          if (attempts < maxAttempts) {
            setTimeout(pollForReady, pollIntervalMs);
          } else {
            // Give up after maxAttempts but still navigate to dashboard so user can check later
            setIsProcessing(false);
            setCurrentState(AppState.DASHBOARD);
          }
        };

        pollForReady();

      } catch (error) {
        console.error("Error processing video:", error);
        const _ = await api.logError(error);
        alert("Failed to start video generation. Please try again.");
        setIsProcessing(false);
      }
    })();
  };

  const handleProcessingComplete = () => {
    // No-op: we now control transition based on actual video availability.
  };

  const handleReset = () => {
    // Cleanup URLs
    uploadedClips.forEach(clip => URL.revokeObjectURL(clip.previewUrl));
    setUploadedClips([]);
    setOutputVideoUrl(null);
    setCurrentRender(null);
    setCurrentState(AppState.LANDING);
  };

  const handleViewVideo = (render: VideoRender) => {
    setCurrentRender(render);
    setOutputVideoUrl(render.videoUrl || api.getVideoUrl(render.filename));
    setCurrentState(AppState.RESULT);
  };

  const handleGoToDashboard = () => {
    setCurrentState(AppState.DASHBOARD);
  };

  const handleCreateNew = () => {
    setCurrentState(AppState.LANDING);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    // Refresh quota state
    if (user) {
      const updatedQuota = quotaStore.getUserQuota(user.id);
      setUserQuota(updatedQuota);
    }
  };

  const handleShowPaymentModal = () => {
    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-vireo-offwhite font-sans text-vireo-dark overflow-x-hidden relative dark:bg-gray-900 dark:text-white transition-colors duration-300">

      {/* Navbar / Logo Area */}
      <header className="w-full p-3 sm:p-6 flex items-center justify-between max-w-7xl mx-auto z-50 relative">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={handleReset}
        >
          <VireoBird className="w-20 h-20 transform group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-2xl font-black tracking-tight text-vireo-dark group-hover:text-vireo-teal transition-colors dark:text-white">
            Vireo
          </span>
        </div>
        {/* Placeholder for menu or login */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-vireo-dark" />}
          </button>
          <SignedIn>
            {userQuota && (
              <QuotaIndicator
                remainingGenerations={quotaStore.getRemainingGenerations(user?.id || '')}
                isPremium={userQuota.isPremium}
                onClick={handleShowPaymentModal}
              />
            )}
            <button
              onClick={handleGoToDashboard}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Go to Dashboard"
              title="Dashboard"
            >
              <LayoutDashboard className="w-6 h-6 text-vireo-dark dark:text-white" />
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-vireo-teal text-white rounded-lg font-bold hover:bg-opacity-90 transition-all">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">

        {currentState === AppState.LANDING && (
          <LandingView
            onStartProcessing={handleStartProcessing}
            isSignedIn={isSignedIn}
            isProcessing={isProcessing}
            userId={user?.id}
            userName={user?.fullName || user?.firstName || user?.username || 'User'}
            userEmail={user?.primaryEmailAddress?.emailAddress}
            canGenerate={userQuota ? quotaStore.canGenerate(user?.id || '') : true}
            onShowPaymentModal={handleShowPaymentModal}
          />
        )}

        {currentState === AppState.PROCESSING && (
          <ProcessingView />
        )}

        {currentState === AppState.DASHBOARD && (
          <DashboardView
            onCreateNew={handleCreateNew}
            onViewVideo={handleViewVideo}
          />
        )}

        {currentState === AppState.RESULT && (
          <ResultView
            clips={uploadedClips}
            videoUrl={outputVideoUrl}
            onReset={handleReset}
            onViewGallery={handleGoToDashboard}
          />
        )}

      </main>

      {/* Payment Modal */}
      {user && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
          userId={user.id}
          userName={user.fullName || user.firstName || user.username || 'User'}
          userEmail={user.primaryEmailAddress?.emailAddress}
          remainingGenerations={quotaStore.getRemainingGenerations(user.id)}
        />
      )}

      {/* Footer */}
      <footer className="w-full py-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Made with ❤️ by Noah and Rajat</p>
      </footer>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-vireo-teal rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-vireo-purple rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute top-[40%] right-[10%] w-[200px] h-[200px] bg-vireo-pink rounded-full opacity-5 blur-3xl"></div>
      </div>

    </div>
  );
};

export default App;
