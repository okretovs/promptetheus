import { useEffect, useState } from 'react';
import { syncService } from '../services/sync';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending operations
    const checkPending = async () => {
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncService.syncPendingOperations();
      if (result.synced > 0) {
        alert(`Synced ${result.synced} operations successfully!`);
      }
      if (result.failed > 0) {
        alert(`Failed to sync ${result.failed} operations.`);
      }
    } finally {
      setSyncing(false);
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }

    setDeferredPrompt(null);
  };

  return (
    <>
      {/* Offline/Sync Indicator */}
      {(!isOnline || pendingCount > 0) && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="card p-4 bg-dark-800 border-dark-600 shadow-lg">
            <div className="flex items-center gap-3">
              {!isOnline && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Offline</span>
                </div>
              )}
              {isOnline && pendingCount > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-300">
                      {pendingCount} pending {pendingCount === 1 ? 'operation' : 'operations'}
                    </span>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 z-50 max-w-sm">
          <div className="card p-4 bg-primary-900/90 border-primary-600 shadow-lg">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-semibold mb-1">Install Promptetheus</h3>
                <p className="text-sm text-gray-300">
                  Install this app for offline access and a better experience
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleInstall} className="btn-primary text-sm">
                  Install
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="btn-secondary text-sm"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
