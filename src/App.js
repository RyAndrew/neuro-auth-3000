const App = () => {
  // Get the current route from the hash, stripping query parameters, or from pathname
  const getRouteFromHash = () => {
    // Check if we're on /login path first
    if (location.pathname === '/login') {
      return 'login';
    }
    
    // Also check for #login hash (but don't rewrite URL)
    if (location.hash === '#login' || location.hash.startsWith('#login?')) {
      return 'login';
    }
    
    const hash = location.hash.replace('#', '') || 'home';
    // Split on '?' to remove query parameters and get just the route
    return hash.split('?')[0];
  };

  const [route, setRoute] = React.useState(getRouteFromHash());
  
  // Update route when hash changes
  React.useEffect(() => {

    //bugfix for back button - prevent page cache to re-render after piv fails and you hit back
    document.body.onunload=function(){}

    // Helper function to hide the loading spinner
    const hideLoadingSpinner = () => {
      const rootLoading = document.querySelector('#rootloading');
      if (rootLoading) {
        rootLoading.classList.add("hide-element");
      }
    };

    const handleHashChange = () => {
      console.log('handleHashChange',location.hash);
      setRoute(getRouteFromHash());
    };

    const handlePopState = () => {
      console.log('handlePopState', location.pathname, location.hash);
      setRoute(getRouteFromHash());
    };

    hideLoadingSpinner(); // Hide spinner
    
    addEventListener('hashchange', handleHashChange);
    addEventListener('popstate', handlePopState);
    
    return () => {
      removeEventListener('hashchange', handleHashChange);
      removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  // Render component based on route
  const renderComponent = () => {
    switch (route) {
      case 'home':
        return <Home />;
      case 'login':
        return <Login />;
      case 'profile':
        return <Profile />;
      case 'data':
        return <DataManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };
  
  return (
    <div className="neuro-auth-app">
      <DebugLogProvider>
        <OktaAuthProvider>
          <div>
            <Navbar />
            {renderComponent()}
          </div>
        </OktaAuthProvider>
      </DebugLogProvider>
    </div>
  );
};