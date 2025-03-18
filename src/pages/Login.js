const widgetActiveContextContext = React.createContext(null)

const Login = () => {
  const { authState, authClient, oktaConfig } = useAuthContext()
  const [widgetActiveContext, setWidgetActiveContext] = React.useState({ loading: true })
  const [postLoginLoading, setPostLoginLoading] = React.useState(false)
  const { addLog, LOG_TYPES } = useDebugLog()
  
  const widgetRef = React.useRef(null);
  
  React.useEffect(() => {
    if (authState.isAuthenticated) {
      addLog(LOG_TYPES.LOGIN, 'Authentication successful, redirecting to home')
      console.log("you're now authenticated!")
      window.location = window.location.origin + '/#home';
      return;
    }
  }, [authState.isAuthenticated, authClient]);
  
  React.useEffect(() => {
    console.log('useEffect once - OktaSignIn');
    addLog(LOG_TYPES.LOGIN, 'Initializing Okta Sign-In widget');

    const signIn = new OktaSignIn({
      ...oktaConfig,
      authClient: authClient,
      baseUrl: window.location.origin + '/#login',
      el: widgetRef.current,
      features:{
        autoFocus: false,
      }
    });
    
    signIn.on('afterRender', function (context) {
      console.log('signIn on afterRender context',context)
      addLog(LOG_TYPES.LOGIN, 'Sign-in widget rendered', { formName: context.formName })
      setWidgetActiveContext({ ...context, loading: false })
      
      if(context.formName === "terminal"){
        let errorString = document.querySelector('.o-form-error-container')?.innerHTML
        if(errorString?.includes("You have been logged out due to inactivity")){
          addLog(LOG_TYPES.LOGOUT, 'Session expired due to inactivity')
          reloadLoginPage()
        }
      }
    })
    
    signIn.showSignIn().then(function(result) {
      console.log('showSignIn then',result)
      addLog(LOG_TYPES.LOGIN, 'Sign-in successful', {
        tokenType: Object.keys(result.tokens || {}).join(', ')
      })
      signIn.remove()
      console.log('result.tokens',result.tokens)
      console.log(authClient)
      authClient.tokenManager.setTokens(result.tokens)
      setPostLoginLoading(true)
      window.location = window.location.origin + '/#home';
    }).catch(async function(error) {
      console.error(error)
      console.error('error.name',error.name)
      addLog(LOG_TYPES.ERROR, `Login error: ${error.name}`, { errorType: error.name })
      
      if(error?.name === 'AuthApiError'){
        console.log('error?.xhr',error?.xhr)
        addLog(LOG_TYPES.ERROR, 'Authentication API error occurred')
        
        if(!error?.xhr?.responseText){
          console.log('no auth api error response found')
          addLog(LOG_TYPES.ERROR, 'No auth API error response found')
          return
        }
        let responseJson
        try{
          responseJson = JSON.parse(error.xhr.responseText)
        }catch(err){      
          document.getElementById("error").innerHTML = 'Error Logging In! <BR /><B>'+error.xhr.responseText+'</B><BR />via showSignIn catch error<BR /><button onclick="location.reload()">Refresh Page</button>'
          addLog(LOG_TYPES.ERROR, 'Failed to parse error response', {
            response: error.xhr.responseText
          })
          return
        }
        
        document.getElementById("error").innerHTML = 'Error Logging In! <BR /><B>'+error.xhr.responseText+'</B><BR />via showSignIn catch error<BR /><button onclick="location.reload()">Refresh Page</button>'
        console.log('responseJson',responseJson)
        if(responseJson?.messages?.value[0]?.i18n?.key ==='idx.session.expired'){
          addLog(LOG_TYPES.LOGOUT, 'Session expired')
          authClient.transactionManager.clear()
          reloadLoginPage()
        }
        console.log('AuthApiError detected :(')
        authClient.transactionManager.clear()
        await authClient.idx.cancel()
        reloadLoginPage()
        return
      }
      
      if(error?.name === 'CONFIG_ERROR'){
        addLog(LOG_TYPES.ERROR, 'Configuration error occurred')
        await authClient.idx.cancel()
        reloadLoginPage()
        return
      }
      
      document.getElementById("error").innerHTML = 'Error Logging In! <BR /><B>'+error+'</B><BR />via showSignIn catch error<BR /><button onclick="location.reload()">Refresh Page</button>'
    })
    
    return () => {
      try {
        signIn.remove();
      } catch (err) {
        console.error('Error removing Okta widget', err);
        addLog(LOG_TYPES.ERROR, 'Error removing Okta widget', {
          error: err.message
        });
      }
    };
  }, []);
  
  function reloadLoginPage(){
    addLog(LOG_TYPES.INFO, 'Reloading login page')
    window.location = window.location.origin + '/#login';
  }
//   <div className="text-center mb-4">
//   <h2 className="neon-text">NEURAL ACCESS GATEWAY</h2>
//   <p className="lead">Initiating biometric verification sequence</p>
//   <div className="retro-separator"></div>
// </div>
  const totpSeed = getTotpSeed()

  return (
    <div className="container mt-4 page-transition">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <widgetActiveContextContext.Provider value={widgetActiveContext}>

            {widgetActiveContext?.loading || postLoginLoading ? (
              <div className="loading-container">
                <div className="quantum-spinner">
                  <div className="spinner-inner"></div>
                  <div className="spinner-text neon-text-purple">
                    {postLoginLoading ? "GRANTING ACCESS" : "QUANTUM AUTHENTICATION"}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <LogMeInButton totpSeed={totpSeed}/>
                <TotpButton totpSeed={totpSeed}/>
              </>
            )}
            <div className="retro-login retro-login-container" ref={widgetRef}></div>
            <div id="error"></div>
          </widgetActiveContextContext.Provider>
          <div className="text-center mt-4">
            <p className="text-muted">SYSTEM VERSION 3.7.9 // CLASSIFIED // AUTHORIZED PERSONNEL ONLY</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 