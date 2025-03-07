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
      <div className="container-fluid p-0 text-center">
        <div className="neon-text-purple" style={{fontSize: "1.5rem"}}>
          LOADING SYSTEM CONFIGURATION...
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Get the issuer URL from the auth client
  const settingsUrl = authClient.options.issuer + '/account-settings/security';

  return (
    <div className="settings-container">
      <div className="card border-0 rounded-0 h-100">
        <div className="card-body p-0 h-100">
          <div className="retro-iframe-container h-100">
            <iframe
              src={`${settingsUrl}`}
              className="retro-iframe"
              title="System Settings"
              allow="publickey-credentials-get; publickey-credentials-create"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

//export default Settings; 