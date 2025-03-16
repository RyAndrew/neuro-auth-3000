//import React, { useEffect } from 'react';
//import { useAuthContext } from '../contexts/AuthContext';

const Settings = () => {
  const { authState, authClient } = useAuthContext();
  
  // Add class to body when component mounts
  React.useEffect(() => {
    document.body.classList.add('settings-page-active');

    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('settings-page-active');
    };
  }, []);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      location.hash = 'login';
    }
  }, [authState]);

  if (authState.isLoading) {
    return (
      <div id="settingsloading" className="container mt-4 page-transition">
        <div className="loading-container">
          <div className="quantum-spinner">
            <div className="spinner-inner"></div>
            <div className="spinner-text neon-text-purple">Settings Loading</div>
          </div>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Get the issuer URL from the auth client and extract domain
  const issuerUrl = new URL(authClient.options.issuer);
  const settingsUrl = `${issuerUrl.protocol}//${issuerUrl.host}/account-settings/security';`;

  const handleLoad = () => {
    const settingsLoading = document.querySelector('#settingsloading');
    settingsLoading.classList.add("hide-element");
  };

  return (
    <div className="settings-container">
      <div className="card border-0 rounded-0 h-100">
        <div className="card-body p-0 h-100">
          <div className="retro-iframe-container h-100">
            <div id="settingsloading" className="container mt-4 page-transition">
              <div className="loading-container">
                <div className="quantum-spinner">
                  <div className="spinner-inner"></div>
                  <div className="spinner-text neon-text-purple">Settings Loading</div>
                </div>
              </div>
            </div>
            <iframe
              src={`${settingsUrl}`}
              className="retro-iframe"
              title="System Settings"
              allow="publickey-credentials-get; publickey-credentials-create"
              onLoad={handleLoad}
              rel="noopener noreferrer" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

//export default Settings; 