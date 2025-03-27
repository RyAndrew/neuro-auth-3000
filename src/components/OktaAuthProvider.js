const OktaAuthContext = React.createContext();

// function addWebAuthnPermissionsPolicy(domain) {
//   // Create the meta tag element
//   const metaTag = document.createElement('meta');
  
//   // Set the required attributes
//   metaTag.setAttribute('http-equiv', 'Permissions-Policy');
//   metaTag.setAttribute('content', `publickey-credentials-create=(self "${domain}")`);
//   console.log('adding meta tag for domain',domain)
//   // Add the meta tag to the document head
//   document.head.appendChild(metaTag);
// }

// Auth provider component
const OktaAuthProvider = ({ children }) => {
  // Auth context for managing authentication state
  
  //addWebAuthnPermissionsPolicy(oktaConfig.issuer)
  const oktaConfig = getOktaConfig()

  const [authState, setAuthState] = React.useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    tokens: null
  });
  
  const authClient = React.useMemo(() => {
    return new OktaAuth(oktaConfig);
  }, []);
  
  const { addLog, LOG_TYPES } = useDebugLog();
  
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
    console.log('okta auth auth provider effect');
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
        
    authClient.authStateManager.subscribe(function (authState) {
      console.log('authStateManager!', authState);
      addLog(LOG_TYPES.INFO, 'Auth state changed', { newState: authState.status });
      checkAuthentication();
    });

    // Subscribe to token changes
    const tokenSubscription = authClient.tokenManager.on('expired', async (key) => {
      addLog(LOG_TYPES.TOKEN_REFRESH, 'Token expired', { tokenKey: key });
      const tokens = await checkTokens();
      setAuthState(prev => ({ ...prev, tokens }));
    });
    
    authClient.start();
    
    return () => {
      tokenSubscription();
    };
  }, [authClient]);
  
  const login = async () => {
    addLog(LOG_TYPES.LOGIN, 'Login attempt initiated');
    console.log('OktaAuth login');
  };
  
  const logout = async () => {
    addLog(LOG_TYPES.LOGOUT, 'Logout initiated');
    await authClient.signOut();
    addLog(LOG_TYPES.LOGOUT, 'Logout completed successfully');
    setAuthState({ isAuthenticated: false, isLoading: false, user: null, tokens: null });
  };
  
  const value = {
    authState,
    authClient,
    login,
    logout,
    oktaConfig: oktaConfig,
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