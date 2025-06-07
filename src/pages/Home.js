const Home = () => {
  const { authState } = useAuthContext();
  
  if (authState.isLoading) {
    return (
      <div className="container mt-4 page-transition">
        <div className="loading-container">
          <div className="quantum-spinner">
            <div className="spinner-inner"></div>
            <div className="spinner-text neon-text-purple">QUANTUM AUTHENTICATION</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mt-4 page-transition">
      {authState.isAuthenticated ? (
        <>
          <div className="jumbotron home-jumbotron glow-enter pt-3">
              <h2 className="text-center neon-text-purple mb-4">COHERENCE WAVE ESTABLISHED</h2>
              <p className="text-center home-welcome-text neon-text mb-4">Welcome back, <strong className="neon-text-pink">{authState.user?.name}</strong></p>
              <VisualizationCircle />
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
        </>
      ) : (
        <>
          <div className="jumbotron home-jumbotron">
            <h1 className="display-4 neon-text-pink">SECURE YOUR DIGITAL FUTURE</h1>
            <p className="lead neon-text">Experience next-generation authentication in this cutting-edge demo</p>
            <div className="retro-separator"></div>
            <div className="glow-enter">
              <p className="neon-text">Login required for system access. Unauthorized users will be terminated.</p>
              <div className="mt-4 mb-4">
                <a className="btn btn-retro btn-retro-primary" href="#login">
                  <i className="bi bi-shield-lock me-2"></i>Initialize Login Sequence
                </a>
              </div>
            </div>
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
              <div className="home-container-card h-100 quantum-protection-card">
                <div className="card-body text-center tesseract-card-body">
                  <div className="visualizer-card-content">
                    <h3 className="neon-text-purple">Quantum Protection</h3>
                    <p className="neon-text">Defense matrices guarding your digital identity.</p>
                  </div>
                  <VisualizationTesseract verticalOffsetPercent={5} />
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
        </>
      )}
    </div>
  );
};