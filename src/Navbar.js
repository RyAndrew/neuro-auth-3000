const Navbar = () => {
  const { authState, logout } = useAuthContext();
  
  const closeOffcanvas = () => {
    const offcanvas = document.getElementById('navbarOffcanvas');
    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvas);
    if (bsOffcanvas) {
      bsOffcanvas.hide();
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    closeOffcanvas();
    logout();
  };
  
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <div className="d-none d-lg-flex align-items-center w-100">
            <a className="navbar-brand neon-text" href="/#home">NEURO-AUTH 3000</a>
            <ul className="navbar-nav ms-3">
              <li className="nav-item">
                <a className="nav-link" href="/#home">MAINFRAME</a>
              </li>
              {authState.isAuthenticated && (
                <>
                  <li className="nav-item">
                    <a className="nav-link" href="/#profile">IDENTITY</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="/#data">DATA MANAGER</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="/#settings">SETTINGS</a>
                  </li>
                </>
              )}
            </ul>
            <div className="ms-auto">
              {authState.isAuthenticated ? (
                <a className="btn btn-retro btn-retro-danger" href="#" onClick={handleLogout}>
                  DISCONNECT
                </a>
              ) : (
                <a className="btn btn-retro btn-retro-primary" href="/#login">
                  ACCESS
                </a>
              )}
            </div>
          </div>
          <div className="d-lg-none d-flex align-items-center w-100">
            <a className="navbar-brand neon-text" href="/#home">NEURO-AUTH 3000</a>
            <button 
              className="navbar-toggler border-0 ms-auto" 
              type="button" 
              data-bs-toggle="offcanvas" 
              data-bs-target="#navbarOffcanvas"
              aria-controls="navbarOffcanvas"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>
        </div>
      </nav>

      <div className="offcanvas offcanvas-end" tabIndex="-1" id="navbarOffcanvas" aria-labelledby="navbarOffcanvasLabel">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title neon-text" id="navbarOffcanvasLabel">NEURO-AUTH 3000</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link" href="/#home" onClick={closeOffcanvas}>MAINFRAME</a>
            </li>
            {authState.isAuthenticated && (
              <>
                <li className="nav-item">
                  <a className="nav-link" href="/#profile" onClick={closeOffcanvas}>IDENTITY</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/#data" onClick={closeOffcanvas}>DATA MANAGER</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/#settings" onClick={closeOffcanvas}>SETTINGS</a>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex">
            {authState.isAuthenticated ? (
              <a className="btn btn-retro btn-retro-danger w-100" href="#" onClick={handleLogout}>
                DISCONNECT
              </a>
            ) : (
              <a className="btn btn-retro btn-retro-primary" href="/#login" onClick={closeOffcanvas}>
                ACCESS
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
};