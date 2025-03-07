const Home = () => {
  const { authState } = useAuthContext();
  
  return (
    <div className="container mt-4 page-transition">
      <div className="jumbotron">
        <h1 className="display-4 neon-text-pink">SECURE YOUR DIGITAL FUTURE</h1>
        <p className="lead neon-text">Experience next-generation authentication in this cutting-edge demo</p>
        <div className="retro-separator"></div>
        {authState.isAuthenticated ? (
          <div className="glow-enter">
            <p className="neon-text-purple">Welcome back, <strong className="neon-text">{authState.user?.name}</strong>!</p>
            <p className="neon-text">Your identity is confirmed. Access to restricted areas granted.</p>
            <div className="mt-4">
              <a className="btn btn-retro btn-retro-success me-3" href="#profile">
                <i className="bi bi-person-circle me-2"></i>View Your Profile
              </a>
            </div>
          </div>
        ) : (
          <div className="glow-enter">
            <p className="neon-text">Login required for system access. Unauthorized users will be terminated.</p>
            <div className="mt-4">
              <a className="btn btn-retro btn-retro-primary" href="#login">
                <i className="bi bi-shield-lock me-2"></i>Initialize Login Sequence
              </a>
            </div>
          </div>
        )}
      </div>
      
      <div className="row mt-5">
        <div className="col-md-4 mb-4">
          <div className="home-container-card h-100">
            <div className="card-body text-center">
              <h3 className="neon-text">Biometric Security</h3>
              <p className="neon-text-purple">Next-gen auth protocols with military-grade encryption.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="home-container-card h-100">
            <div className="card-body text-center">
              <h3 className="neon-text-purple">Quantum Protection</h3>
              <p className="neon-text">Defense matrices guarding your digital identity.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="home-container-card h-100">
            <div className="card-body text-center">
              <h3 className="neon-text-pink">Neural Access</h3>
              <p className="neon-text">Single sign-on with cognitive interface technology.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};