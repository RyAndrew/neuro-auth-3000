const OktaTokenViewer = () => {
  const { authState, authClient } = useAuthContext();
  const [showModal, setShowModal] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [decodedTokens, setDecodedTokens] = React.useState({
    idToken: null,
    accessToken: null,
    refreshToken: null
  });
  
  // Don't render anything while auth state is loading
  if (authState.isLoading) {
    return null;
  }

  const formatExpiration = (exp) => {
    if (!exp) return 'N/A';
    const date = new Date(exp * 1000);
    return util.convertUtcStringToDateTimeString(date.toISOString());
  };

  const convertTimeStampToDateTimeString = (timestamp) => {
    const dateToFormat = new Date(parseInt(timestamp, 10) * 1000);
    return dateToFormat.toLocaleDateString() + ' ' + dateToFormat.toLocaleTimeString();
  };
  
  const convertClaimsUtcToLocaleDates = (token) => {
    if (!token) return null;
    
    const timeClaims = ['iat', 'exp', 'expiresAt', 'auth_time'];
    const formattedToken = {};
    
    for (const claim in token) {
      if (timeClaims.includes(claim)) {
        formattedToken[claim] = token[claim] + ' (' + convertTimeStampToDateTimeString(token[claim]) + ')';
      } else {
        formattedToken[claim] = token[claim];
      }
    }
    return formattedToken;
  };

  const handleViewTokens = async () => {
    try {
      // Get tokens from Okta Auth JS
      const tokens = await authClient.tokenManager.getTokens();
      
      // Format token claims with readable dates
      const decoded = {
        idToken: tokens.idToken ? convertClaimsUtcToLocaleDates(tokens.idToken.claims) : null,
        accessToken: tokens.accessToken ? convertClaimsUtcToLocaleDates(tokens.accessToken.claims) : null,
        refreshToken: tokens.refreshToken ? convertClaimsUtcToLocaleDates({...tokens.refreshToken, expiresAt: tokens.refreshToken.expiresAt}) : null
      };
      
      setDecodedTokens(decoded);
      
      // Show modal
      setShowModal(true);
    } catch (error) {
      console.error('Error getting tokens:', error);
    }
  };

  const refreshTokens = async () => {
    try {
      // Set refreshing state to show spinner
      setIsRefreshing(true);
      
      // Refresh tokens using authClient
      await authClient.tokenManager.renew('accessToken');
      if (authState.tokens?.idToken) {
        await authClient.tokenManager.renew('idToken');
      }
      
      // Get updated tokens
      const tokens = await authClient.tokenManager.getTokens();
      
      // Format token claims with readable dates
      const decoded = {
        idToken: tokens.idToken ? convertClaimsUtcToLocaleDates(tokens.idToken.claims) : null,
        accessToken: tokens.accessToken ? convertClaimsUtcToLocaleDates(tokens.accessToken.claims) : null,
        refreshToken: tokens.refreshToken ? convertClaimsUtcToLocaleDates({...tokens.refreshToken, expiresAt: tokens.refreshToken.expiresAt}) : null
      };
      
      setDecodedTokens(decoded);
    } catch (error) {
      console.error('Error refreshing tokens:', error);
    } finally {
      // Reset refreshing state
      setIsRefreshing(false);
    }
  };

  // Use React Fragment to wrap multiple components
  return (
    <>
      <div className="h-100 d-flex flex-column">
        <div className="flex-grow-1 d-flex flex-column">
          <div className="mb-2">
            <span className="neon-text">Access Token: </span>
            {authState.tokens?.accessToken ? (
              <span className="neon-text-purple">
                Expires {formatExpiration(authState.tokens.accessToken.expiresAt)}
              </span>
            ) : (
              <span className="neon-text-pink">Not Available</span>
            )}
          </div>
          <div>
            <span className="neon-text">Refresh Token: </span>
            {authState.tokens?.refreshToken ? (
              <span className="neon-text-purple">
                Expires {formatExpiration(authState.tokens.refreshToken.expiresAt)}
              </span>
            ) : (
              <span className="neon-text-pink">Not Available</span>
            )}
          </div>
          <div className="mt-3">
            <button 
              className="btn btn-retro btn-retro-primary w-100" 
              onClick={handleViewTokens}
              disabled={!authState.tokens}
            >
              Tokens
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block debug-log-modal" tabIndex="-1">
          <div className="modal-dialog modal-fullscreen debug-log-dialog">
            <div className="modal-content bg-dark debug-log-content">
              <div className="modal-header border-secondary debug-log-header">
                <h5 className="modal-title neon-text">OAuth Tokens</h5>
                <div className="ms-auto me-2 d-flex">
                  <button
                    className="btn btn-retro btn-retro-success me-2"
                    onClick={refreshTokens}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Refreshing...
                      </>
                    ) : (
                      <>🔄 Refresh</>
                    )}
                  </button>
                  <button
                    className="btn btn-retro btn-retro-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    ❌ Close
                  </button>
                </div>
              </div>
              <div className="modal-body">
                <div className="token-viewer-container">
                  {/* ID Token */}
                  <div className="mb-4">
                    <h6 className="neon-text">ID Token</h6>
                    {decodedTokens.idToken ? (
                      <pre className="text-light bg-dark p-3 rounded border border-secondary">{JSON.stringify(decodedTokens.idToken, null, 2)}</pre>
                    ) : (
                      <p className="neon-text-pink">Not Available</p>
                    )}
                  </div>
                  
                  {/* Access Token */}
                  <div className="mb-4">
                    <h6 className="neon-text">Access Token</h6>
                    {decodedTokens.accessToken ? (
                      <pre className="text-light bg-dark p-3 rounded border border-secondary">{JSON.stringify(decodedTokens.accessToken, null, 2)}</pre>
                    ) : (
                      <p className="neon-text-pink">Not Available</p>
                    )}
                  </div>
                  
                  {/* Refresh Token */}
                  <div>
                    <h6 className="neon-text">Refresh Token</h6>
                    {decodedTokens.refreshToken ? (
                      <pre className="text-light bg-dark p-3 rounded border border-secondary">{JSON.stringify(decodedTokens.refreshToken, null, 2)}</pre>
                    ) : (
                      <p className="neon-text-pink">Not Available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};