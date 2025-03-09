const Profile = () => {
  const { authState } = useAuthContext();
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      location.hash = 'login';
    }
  }, [authState]);
  
  if (authState.isLoading) {
    return (
      <div className="container mt-4 text-center">
        <div className="neon-text-purple" style={{fontSize: "1.5rem"}}>
          LOADING NEURAL INTERFACE...
        </div>
      </div>
    );
  }
  
  if (!authState.isAuthenticated) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <div className="container mt-4 page-transition">
      <h2 className="neon-text-pink mb-4">DIGITAL IDENTITY MATRIX</h2>
      
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <div style={{fontSize: "64px", marginBottom: "15px"}}>👤</div>
              <h3 className="neon-text">{authState.user.name}</h3>
              <div className="retro-separator"></div>
              <p className="neon-text-purple">ACCESS LEVEL: ALPHA</p>
              <p className="neon-text">STATUS: ACTIVE</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title neon-text-purple">IDENTITY PARAMETERS</h5>
              <div className="retro-separator"></div>
              
              <div className="row mb-3">
                <div className="col-md-4 neon-text">Communication Node:</div>
                <div className="col-md-8 neon-text-purple">{authState.user.email}</div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-4 neon-text">System Identifier:</div>
                <div className="col-md-8 neon-text-purple">{authState.user.preferred_username}</div>
              </div>
              
              <h6 className="mt-4 mb-3 neon-text-pink">CRYPTOGRAPHIC SIGNATURE:</h6>
              <pre className="p-3">
                {JSON.stringify(authState.user, null, 2)}
              </pre>
              
              <div className="text-center mt-4">
                <a className="btn btn-retro btn-retro-primary" href="#home">
                  RETURN TO MAINFRAME
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};