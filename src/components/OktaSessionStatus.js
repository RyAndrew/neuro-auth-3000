const OktaSessionStatus = () => {
  const [session, setSession] = React.useState(null)
   
  const { authClient, authState } = useAuthContext();
  const { addLog, LOG_TYPES } = useDebugLog();
  
  function checkOktaSession() {
      //oktaSessionLastCheck = new Date()

      //check if okta session is active currently
      authClient.session.get()
        .then(function (session) {
            setSession(session)        
            addLog(LOG_TYPES.INFO, 'Session status checked', {
              status: session.status,
              expiresAt: session.expiresAt
            });
            //oktaSessionExpires = new Date(session.expiresAt)
        })
        .catch(function (err) {
            addLog(LOG_TYPES.ERROR, 'Failed to get Okta session', {
              error: err.message
            });
            console.log('failed to get okta session', err)
            throw err
        })
  }
  
  function clickCloseSession(){
    addLog(LOG_TYPES.LOGOUT, 'Session close initiated');
    authClient.session.close().then(() => {
      addLog(LOG_TYPES.LOGOUT, 'Session closed successfully');
      checkOktaSession()
    }).catch(function (err) {
      addLog(LOG_TYPES.ERROR, 'Error closing Okta session', {
        error: err.message
      });
      console.log('Error closing okta session', err)
      throw err
    })
  }
  
  React.useEffect(() => {
    checkOktaSession()
  }, []);
  
  // Don't render anything while auth state is loading
  if (authState.isLoading) {
    return null;
  }
  
  return (
    <div className="h-100 d-flex flex-column">
      <div className="flex-grow-1 d-flex flex-column">
        <div className="neon-text mb-2">
          Okta Session {session?.status === 'ACTIVE' ? ( 'ACTIVE' ) : ( 'INACTIVE' )}
        </div>
        {session?.status === 'ACTIVE' && (
          <>
            <div className="neon-text-purple mb-2">
              Expires {util.convertUtcStringToDateTimeString(session.expiresAt)}
            </div>
            <button 
              className="btn btn-retro btn-retro-primary mt-auto" 
              type="button" 
              onClick={clickCloseSession}
            >
              Close Session
            </button>
          </>
        )}
      </div>
    </div>
  );
};