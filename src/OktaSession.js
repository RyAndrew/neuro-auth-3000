const OktaSession = () => {
  const [session, setSession] = React.useState(null)
   
  const { authClient } = useAuthContext();
  
  function checkOktaSession() {

      //oktaSessionLastCheck = new Date()

      //check if okta session is active currently
      authClient.session.get()
        .then(function (session) {
            setSession(session)        
            //oktaSessionExpires = new Date(session.expiresAt)
        })
        .catch(function (err) {
            console.log('failed to get okta session', err)
            throw err
        })
  }
  function clickCloseSession(){
    authClient.session.close().then(() => {
        checkOktaSession()
    }).catch(function (err) {
        console.log('Error closing okta session', err)
        throw err
    })
  }
  
  React.useEffect(() => {
    checkOktaSession()
  }, []);
  
  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-12">
          Okta Session {session?.status === 'ACTIVE' ? ( 'ACTIVE' ) : ( 'INACTIVE' )}
          {session?.status === 'ACTIVE' ? <><br />Expires {util.convertUtcStringToDateTimeString(session.expiresAt)}<br /><button 
              className="btn btn-retro btn-retro-primary" 
              type="button" 
              onClick={clickCloseSession}
            >Close Session</button></> : <></>}
        </div>
      </div>
    </div>
  );
};