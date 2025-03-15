const App = () => {
  // Get the current route from the hash
  const [route, setRoute] = React.useState(location.hash.replace('#', '') || 'home');
  
  // Update route when hash changes
  React.useEffect(() => {

    //bugfix for back button - prevent page cache to re-render after piv fails and you hit back
    document.body.onunload=function(){}

    const handleHashChange = () => {
      console.log('handleHashChange',location.hash);
      setRoute(location.hash.replace('#', '') || 'home');
    };

    const rootLoading = document.querySelector('#rootloading');
    rootLoading.classList.add("hide-element");
    
    addEventListener('hashchange', handleHashChange);
    return () => removeEventListener('hashchange', handleHashChange);
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
        <AuthProvider>
          <div>
            <Navbar />
            {renderComponent()}
          </div>
        </AuthProvider>
      </DebugLogProvider>
    </div>
  );
};