const OktaTokenViewer = () => {
  const { authState, authClient } = useAuthContext();
  const [showModal, setShowModal] = React.useState(false);
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

  const decodeToken = (tokenObj) => {
    if (!tokenObj) return null;
    
    // Try to find the token string
    let tokenStr;
    if (typeof tokenObj === 'string') {
      tokenStr = tokenObj;
    } else if (tokenObj.idToken) {
      tokenStr = tokenObj.idToken;
    } else if (tokenObj.accessToken) {
      tokenStr = tokenObj.accessToken;
    } else if (tokenObj.refreshToken) {
      tokenStr = tokenObj.refreshToken;
    } else {
      console.error('Unable to determine token string:', tokenObj);
      return null;
    }
    
    try {
      // Extract the payload part of the JWT (second part)
      const parts = tokenStr.split('.');
      if (parts.length !== 3) return null;
      
      // Decode the base64 payload
      const payload = parts[1];
      const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      
      // Parse the JSON and convert timestamps to readable dates
      const decodedToken = JSON.parse(decodedPayload);
      return convertClaimsUtcToLocaleDates(decodedToken);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const handleViewTokens = () => {
    // Decode the tokens
    const tokens = authState.tokens || {};
    
    const decoded = {
      idToken: tokens.idToken ? decodeToken(tokens.idToken) : null,
      accessToken: tokens.accessToken ? decodeToken(tokens.accessToken) : null,
      refreshToken: tokens.refreshToken ? decodeToken(tokens.refreshToken) : null
    };
    
    setDecodedTokens(decoded);
    
    // Show modal
    setShowModal(true);
  };

  const refreshTokens = async () => {
    try {
      // Refresh tokens using authClient
      await authClient.tokenManager.renew('accessToken');
      if (authState.tokens?.idToken) {
        await authClient.tokenManager.renew('idToken');
      }
      
      // Update decoded tokens
      const tokens = await authClient.tokenManager.getTokens();
      
      const decoded = {
        idToken: tokens.idToken ? decodeToken(tokens.idToken) : null,
        accessToken: tokens.accessToken ? decodeToken(tokens.accessToken) : null,
        refreshToken: tokens.refreshToken ? decodeToken(tokens.refreshToken) : null
      };
      
      setDecodedTokens(decoded);
    } catch (error) {
      console.error('Error refreshing tokens:', error);
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
                  >
                    🔄 Refresh
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