/**
 * Self-contained component for monitoring Okta IDX transaction validity
 * Includes both timer logic and expiration modal UI
 * 
 * @param {Object} authClient - Okta Auth JS client instance
 * @param {boolean} isActive - Whether the timer should be active
 * @param {Function} onRestartNeeded - Callback when restart is needed after expiration
 * @param {Function} addLog - Logging function from debug context
 * @param {Object} LOG_TYPES - Log type constants
 */
const LoginTransactionTimer = ({ authClient, isActive, onRestartNeeded, addLog, LOG_TYPES }) => {
  const sessionTimerRef = React.useRef(null);
  const [showExpiredModal, setShowExpiredModal] = React.useState(false);

  // Function to handle transaction expiration
  const handleTransactionExpired = React.useCallback(() => {
    setShowExpiredModal(true);
  }, []);

  // Function to check transaction validity (used by both timer and visibility event)
  const checkTransactionValidity = React.useCallback(async () => {
    try {
      // Check if we can proceed with an active transaction
      if (!authClient.idx.canProceed()) {
        addLog(LOG_TYPES.ERROR, 'Cannot proceed with transaction - showing expiration modal');
        stopTransactionTimer();
        handleTransactionExpired();
        return false;
      }

      // Get the current transaction state
      const transaction = await authClient.idx.proceed();
      
      if (!transaction?.context?.expiresAt) {
        addLog(LOG_TYPES.ERROR, 'Transaction exists but no expiration timestamp found');
        return true; // Can't determine expiration, assume valid
      }

      // Check if transaction has expired
      const expiresAt = new Date(transaction.context.expiresAt);
      const now = new Date();
      
      if (now >= expiresAt) {
        addLog(LOG_TYPES.LOGOUT, `Transaction expired at ${expiresAt.toISOString()}`);
        stopTransactionTimer();
        handleTransactionExpired();
        return false;
      } else {
        const timeRemaining = Math.round((expiresAt - now) / 1000);
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;
        const timeFormat = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : 
                          minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        addLog(LOG_TYPES.INFO, `Transaction valid - expires in ${timeFormat}`);
        return true;
      }
      
    } catch (error) {
      addLog(LOG_TYPES.ERROR, `Transaction validity check failed: ${error.message}`);
      
      // Stop timer and show modal on any error
      stopTransactionTimer();
      handleTransactionExpired();
      return false;
    }
  }, [authClient, handleTransactionExpired, stopTransactionTimer]); // Removed addLog and LOG_TYPES

  const stopTransactionTimer = React.useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
      addLog(LOG_TYPES.INFO, 'Transaction validity timer stopped');
    }
  }, []); // Removed addLog and LOG_TYPES

  const startTransactionTimer = React.useCallback(() => {
    // Guard clause - don't start if already running or not active
    if (sessionTimerRef.current || !isActive) return;

    addLog(LOG_TYPES.INFO, 'Starting transaction validity timer (checking every 5 seconds)');
    sessionTimerRef.current = setInterval(async () => {
      await checkTransactionValidity();
    }, 5000);
  }, [isActive, checkTransactionValidity]); // Removed addLog and LOG_TYPES

  // Auto-start/stop timer based on isActive
  React.useEffect(() => {
    if (isActive) {
      addLog(LOG_TYPES.INFO, 'Timer conditions met - starting transaction monitoring');
      startTransactionTimer();
    } else {
      addLog(LOG_TYPES.INFO, 'Timer conditions not met - stopping transaction monitoring');
      stopTransactionTimer();
    }
  }, [isActive, startTransactionTimer, stopTransactionTimer]); // Removed addLog and LOG_TYPES

  // Tab visibility event listener for immediate check when tab becomes active
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive) {
        addLog(LOG_TYPES.INFO, 'Tab became active - checking transaction validity');
        checkTransactionValidity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, checkTransactionValidity]); // Removed addLog and LOG_TYPES

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopTransactionTimer();
    };
  }, [stopTransactionTimer]);

  // Function to handle transaction expired modal login button
  const handleTransactionExpiredLogin = React.useCallback(async () => {
    addLog(LOG_TYPES.INFO, 'User clicked login after transaction expiration');
    setShowExpiredModal(false);
    
    // Clean transaction state for fresh restart
    addLog(LOG_TYPES.INFO, 'Clearing transaction state for fresh restart');
    
    try {
      // Primary: Cancel the IDX transaction on server
      await authClient.idx.cancel();
      addLog(LOG_TYPES.INFO, 'IDX transaction cancelled successfully');
    } catch (err) {
      console.log('No IDX transaction to cancel:', err);
      
      // Fallback: Clear local transaction state if idx.cancel fails
      try {
        authClient.transactionManager.clear();
        addLog(LOG_TYPES.INFO, 'Local transaction state cleared as fallback');
      } catch (err2) {
        console.log('No local transaction state to clear:', err2);
      }
    }
    
    addLog(LOG_TYPES.INFO, 'Requesting widget restart from parent component');
    
    // Call the restart callback provided by parent component
    if (onRestartNeeded) {
      onRestartNeeded();
    }
  }, [authClient, onRestartNeeded]); // Removed addLog and LOG_TYPES

  // Render the transaction expired modal if needed
  if (showExpiredModal) {
    return (
      <>
        {/* Transaction Expired Modal */}
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">⚠️ Transaction Expired</h5>
              </div>
              <div className="modal-body">
                <p>Your transaction has expired.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleTransactionExpiredLogin}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal backdrop */}
        <div className="modal-backdrop fade show"></div>
      </>
    );
  }

  // Component doesn't render anything when timer is just running in background
  return null;
};