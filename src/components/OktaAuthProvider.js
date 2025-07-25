const OktaAuthContext = React.createContext();

// Auth provider component
const OktaAuthProvider = ({ children }) => {
  // LocalStorage keys for persistence
  const STORAGE_KEYS = {
    AUTH_TYPE: 'user-auth-type',
    AUTH_SERVER: 'user-auth-server',
    CLASSIC_MODE: 'user-classic-mode'
  }

  // Valid values for validation
  const validAuthTypes = ['custom', 'vanilla', 'redirect'];
  const validAuthServers = ['custom', 'default', 'org'];

  // Store the original config to preserve the original issuer
  const originalOktaConfig = React.useMemo(() => getOktaConfig(), [])

  // Helper function to get stored value or default
  const getStoredValue = (key, defaultValue, validValues) => {
    try {
      const stored = localStorage.getItem(key);
      return stored && validValues.includes(stored) ? stored : defaultValue;
    } catch (error) {
      console.warn('LocalStorage access failed:', error);
      return defaultValue;
    }
  };

  // Helper function to store value
  const storeValue = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('LocalStorage write failed:', error);
    }
  };

  // Helper function to get stored boolean value or default
  const getStoredBooleanValue = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? stored === 'true' : defaultValue;
    } catch (error) {
      console.warn('LocalStorage access failed:', error);
      return defaultValue;
    }
  };

  // Helper function to get query parameters from URL
  const getQueryParams = () => {
    const params = new URLSearchParams(location.search || location.hash.split('?')[1] || '');
    return {
      type: params.get('type'),
      authServer: params.get('authServer')
    };
  };

  // Initialize from query parameters, then localStorage, then defaults
  const initializeFromParams = () => {
    const queryParams = getQueryParams();
    
    // Auth Type: Query params → localStorage → default
    let initialAuthType = 'custom'; // default
    const storedAuthType = getStoredValue(STORAGE_KEYS.AUTH_TYPE, null, validAuthTypes);
    if (storedAuthType) {
      initialAuthType = storedAuthType; // use localStorage
    }
    if (queryParams.type && validAuthTypes.includes(queryParams.type)) {
      initialAuthType = queryParams.type; // query param overrides
      storeValue(STORAGE_KEYS.AUTH_TYPE, queryParams.type); // persist to localStorage
    }

    // Auth Server: Query params → localStorage → default  
    let initialAuthServer = 'custom'; // default
    const storedAuthServer = getStoredValue(STORAGE_KEYS.AUTH_SERVER, null, validAuthServers);
    if (storedAuthServer) {
      initialAuthServer = storedAuthServer; // use localStorage
    }
    if (queryParams.authServer && validAuthServers.includes(queryParams.authServer)) {
      initialAuthServer = queryParams.authServer; // query param overrides
      storeValue(STORAGE_KEYS.AUTH_SERVER, queryParams.authServer); // persist to localStorage
    }

    // Classic Mode: localStorage → default (no query param support)
    const initialClassicMode = getStoredBooleanValue(STORAGE_KEYS.CLASSIC_MODE, false); // default false

    return { initialAuthType, initialAuthServer, initialClassicMode };
  };

  // Initialize values from params/localStorage
  const { initialAuthType, initialAuthServer, initialClassicMode } = initializeFromParams();
  
  // Helper function to get base domain from issuer
  const getBaseDomain = (issuer) => {
    const url = new URL(issuer)
    return `${url.protocol}//${url.host}`
  }

  // Helper function to create config based on auth server
  const createConfigForAuthServer = (serverType, classicMode = false) => {
    const baseDomain = getBaseDomain(originalOktaConfig.issuer)
    let newIssuer
    
    switch(serverType) {
      case 'custom':
        newIssuer = originalOktaConfig.issuer // Original issuer
        break
      case 'default':
        newIssuer = `${baseDomain}/oauth2/default`
        break
      case 'org':
        newIssuer = `${baseDomain}/`
        break
      default:
        newIssuer = originalOktaConfig.issuer
    }
    
    const config = { ...originalOktaConfig, issuer: newIssuer }
    
    // Add useClassicEngine if classic mode is enabled
    if (classicMode) {
      config.useClassicEngine = true
    }
    
    return config
  }

  // Public method to get config for a specific auth server (for Login component)
  const getConfigForAuthServer = React.useCallback((serverType, classicMode) => {
    return createConfigForAuthServer(serverType, classicMode);
  }, []);

  const [currentAuthType, setCurrentAuthType] = React.useState(initialAuthType)
  const [currentAuthServer, setCurrentAuthServer] = React.useState(initialAuthServer)
  const [currentClassicMode, setCurrentClassicMode] = React.useState(initialClassicMode)

  // Initialize config based on determined auth server and classic mode
  const [currentOktaConfig, setCurrentOktaConfig] = React.useState(() => {
    return createConfigForAuthServer(initialAuthServer, initialClassicMode);
  })

  const [authState, setAuthState] = React.useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    tokens: null
  });
  
  // Recreate authClient when config changes
  const authClient = React.useMemo(() => {
    console.log('Creating new OktaAuth client with config:', currentOktaConfig)
    return new OktaAuth(currentOktaConfig);
  }, [currentOktaConfig]);
  
  const { addLog, LOG_TYPES } = useDebugLog();
  
  // Method to update auth type
  const updateAuthType = React.useCallback((newType) => {
    if (validAuthTypes.includes(newType)) {
      setCurrentAuthType(newType)
      storeValue(STORAGE_KEYS.AUTH_TYPE, newType)
    }
  }, [addLog, LOG_TYPES])

  // Method to update auth server and recreate config
  const updateAuthServer = React.useCallback((newServer) => {
    if (validAuthServers.includes(newServer)) {
      setCurrentAuthServer(newServer)
      storeValue(STORAGE_KEYS.AUTH_SERVER, newServer)
      
      const newConfig = createConfigForAuthServer(newServer, currentClassicMode)
      setCurrentOktaConfig(newConfig)
      
      addLog(LOG_TYPES.INFO, `Auth server updated to: ${newServer}`, {
        newIssuer: newConfig.issuer,
        useClassicEngine: newConfig.useClassicEngine || false
      })
    }
  }, [addLog, LOG_TYPES, currentClassicMode])

  // Method to update classic mode and recreate config
  const updateClassicMode = React.useCallback((newClassicMode) => {
    setCurrentClassicMode(newClassicMode)
    storeValue(STORAGE_KEYS.CLASSIC_MODE, newClassicMode.toString())
    
    const newConfig = createConfigForAuthServer(currentAuthServer, newClassicMode)
    setCurrentOktaConfig(newConfig)
    
    addLog(LOG_TYPES.INFO, `Classic mode updated to: ${newClassicMode}`, {
      useClassicEngine: newConfig.useClassicEngine || false
    })
  }, [addLog, LOG_TYPES, currentAuthServer])

  // Method to update the Okta configuration directly (for Login component compatibility)
  const updateOktaConfig = React.useCallback((newConfig) => {
    addLog(LOG_TYPES.INFO, 'Updating Okta configuration directly', {
      oldIssuer: currentOktaConfig.issuer,
      newIssuer: newConfig.issuer
    })
    setCurrentOktaConfig(newConfig)
  }, [currentOktaConfig.issuer, addLog, LOG_TYPES])

  // Log initialization details
  React.useEffect(() => {
    const queryParams = getQueryParams();
    addLog(LOG_TYPES.INFO, 'OktaAuthProvider initialized', {
      queryParams,
      initialAuthType,
      initialAuthServer,
      initialClassicMode,
      initialIssuer: currentOktaConfig.issuer,
      useClassicEngine: currentOktaConfig.useClassicEngine || false
    });
  }, []); // Run once on mount
  
  const checkTokens = async () => {
    try {
      const tokens = await authClient.tokenManager.getTokens();
      if (tokens) {
        addLog(LOG_TYPES.TOKEN_REFRESH, 'Tokens retrieved successfully', {
          accessTokenExpires: tokens.accessToken?.expiresAt,
          refreshTokenExpires: tokens.refreshToken?.expiresAt
        });
      }
      return tokens;
    } catch (error) {
      addLog(LOG_TYPES.ERROR, 'Error getting tokens', { error: error.message });
      return null;
    }
  };
  
  React.useEffect(() => {
    console.log('okta auth auth provider effect - authClient changed');
    
    const checkAuthentication = async () => {
      const isAuthenticated = await authClient.isAuthenticated();
      if (isAuthenticated) {
        const user = await authClient.getUser();
        const tokens = await checkTokens();
        
        addLog(LOG_TYPES.INFO, 'User authenticated successfully', {
          username: user.name,
          email: user.email
        });
        setAuthState({ isAuthenticated, isLoading: false, user, tokens });
      } else {
        addLog(LOG_TYPES.INFO, 'User not authenticated');
        setAuthState({ isAuthenticated, isLoading: false, user: null, tokens: null });
      }
    };
        
    const authStateSubscription = authClient.authStateManager.subscribe(function (authState) {
      console.log('authStateManager!', authState);
      addLog(LOG_TYPES.INFO, 'Auth state changed', authState);
      checkAuthentication();
    });

    // Subscribe to token changes
    const tokenSubscription = authClient.tokenManager.on('expired', async (key) => {
      addLog(LOG_TYPES.TOKEN_REFRESH, 'Token expired', { tokenKey: key });
      const tokens = await checkTokens();
      setAuthState(prev => ({ ...prev, tokens }));
    });
    
    // Start the new authClient
    addLog(LOG_TYPES.INFO, 'Starting new authClient instance');
    authClient.start();
    
    return () => {
      // Properly cleanup the authClient instance
      addLog(LOG_TYPES.INFO, 'Stopping authClient instance');
      try {
        // Remove token subscription
        if (tokenSubscription) {
          tokenSubscription();
        }
        // Stop the authClient to clean up subscriptions and timers
        authClient.stop();
        addLog(LOG_TYPES.INFO, 'AuthClient stopped successfully');
      } catch (error) {
        console.error('Error stopping authClient:', error);
        addLog(LOG_TYPES.ERROR, 'Error stopping authClient', { error: error.message });
      }
    };
  }, [authClient]);
  
  const login = async () => {
    addLog(LOG_TYPES.LOGIN, 'Login attempt initiated');
    console.log('OktaAuth login');
  };
  
  const logout = async () => {
    addLog(LOG_TYPES.LOGOUT, 'Logout initiated');
    
    try {
      // Get the access token to extract the issuer
      const accessToken = await authClient.tokenManager.get('accessToken');
      
      if (accessToken && accessToken.claims && accessToken.claims.iss) {
        const tokenIssuer = accessToken.claims.iss;
        
        if (tokenIssuer !== currentOktaConfig.issuer) {
          addLog(LOG_TYPES.LOGOUT, 'Token issuer differs from current config, using token issuer for logout', {
            tokenIssuer: tokenIssuer,
            currentIssuer: currentOktaConfig.issuer
          });
          
          // Create temporary authClient with token's issuer for logout
          const logoutConfig = { ...currentOktaConfig, issuer: tokenIssuer };
          const logoutAuthClient = new OktaAuth(logoutConfig);
          await logoutAuthClient.signOut();
        } else {
          // Issuers match, use current authClient
          addLog(LOG_TYPES.LOGOUT, 'Token issuer matches current config, using current authClient');
          await authClient.signOut();
        }
      } else {
        // No access token or issuer claim, use current authClient as fallback
        addLog(LOG_TYPES.LOGOUT, 'No access token found, using current authClient for logout');
        await authClient.signOut();
      }
    } catch (error) {
      addLog(LOG_TYPES.ERROR, 'Error during logout process', { error: error.message });
      // Fallback to current authClient on error
      try {
        await authClient.signOut();
      } catch (fallbackError) {
        addLog(LOG_TYPES.ERROR, 'Fallback logout also failed', { error: fallbackError.message });
      }
    }
    
    addLog(LOG_TYPES.LOGOUT, 'Logout completed successfully');
    setAuthState({ isAuthenticated: false, isLoading: false, user: null, tokens: null });
  };
  
  const value = {
    authState,
    authClient,
    login,
    logout,
    oktaConfig: currentOktaConfig,
    updateOktaConfig, // Keep for backward compatibility
    // Configuration management methods
    currentAuthType,
    currentAuthServer,
    currentClassicMode,
    updateAuthType,
    updateAuthServer,
    updateClassicMode,
    getConfigForAuthServer, // Public method to get configs
  };

  // Get current route from hash
  const currentRoute = location.hash.replace('#', '') || 'home';
  
  return (
    <OktaAuthContext.Provider value={value}>
      {children}
      {currentRoute !== 'settings' && !authState.isLoading && (
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch gap-3">
                <div className="flex-grow-1" style={{ flex: '1 1 0' }}>
                  <OktaSessionStatus/>
                </div>
                <div className="flex-grow-1" style={{ flex: '1 1 0' }}>
                  <OktaTokenViewer/>
                </div>
                <div className="flex-grow-1" style={{ flex: '1 1 0' }}>
                  <DebugLogViewer/>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </OktaAuthContext.Provider>
  );
};

// Custom hook for using auth context
const useAuthContext = () => {
  return React.useContext(OktaAuthContext);
};