const AuthContext = React.createContext();

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
const AuthProvider = ({ children }) => {
  // Auth context for managing authentication state
  
  //addWebAuthnPermissionsPolicy(oktaConfig.issuer)

  const [authState, setAuthState] = React.useState({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });
  
  const authClient = React.useMemo(() => {
    return new OktaAuth(oktaConfig);
  }, []);
  
  React.useEffect(() => {
    // Check authentication status
    console.log('okta auth auth provider effect')
    const checkAuthentication = async () => {
      const isAuthenticated = await authClient.isAuthenticated();
      if (isAuthenticated) {
        const user = await authClient.getUser();
        setAuthState({ isAuthenticated, isLoading: false, user });
      } else {
        setAuthState({ isAuthenticated, isLoading: false, user: null });
      }
    };
        
    authClient.authStateManager.subscribe(function (authState) {
      console.log('authStateManager!',authState)
      checkAuthentication();
    })
    
    authClient.start()
    
    // Subscribe to token changes
    // const tokenListener = authClient.token.on('tokenHasExpired', () => {
    //   setAuthState({ isAuthenticated: false, isLoading: false, user: null });
    // });
    
    return () => {
      //tokenListener();
    };
  }, [authClient]);
  
  const login = async () => {
    console.log('OktaAuth login')
    
  };
  
  const logout = async () => {
    await authClient.signOut();
    setAuthState({ isAuthenticated: false, isLoading: false, user: null });
  };
  
  const value = {
    authState,
    authClient,
    login,
    logout
  };

  // Get current route from hash
  const currentRoute = location.hash.replace('#', '') || 'home';
  
  return (
    <AuthContext.Provider value={value}>
      {children}
      {currentRoute !== 'settings' && <OktaSession/>}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
const useAuthContext = () => {
  return React.useContext(AuthContext);
};