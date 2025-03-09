const widgetActiveContextContext = React.createContext(null)

const Login = () => {
  const { authState, authClient } = useAuthContext()
  const [widgetActiveContext, setWidgetActiveContext] = React.useState({ loading: true })
  
  const widgetRef = React.useRef(null);
  
  React.useEffect(() => {
    if (authState.isAuthenticated) {
      console.log("you're now authenticated!")
      window.location = window.location.origin + '/#home';
      return;
    }

  }, [authState.isAuthenticated, authClient]);
  
  React.useEffect(() => {
    console.log('useEffect once - OktaSignIn');

    const signIn = new OktaSignIn({
      baseUrl: window.location.origin + '/#login',
      el: widgetRef.current,
      clientId: oktaConfig.clientId,
      redirectUri: oktaConfig.redirectUri,
      authParams: {
        issuer: oktaConfig.issuer,
        scopes: oktaConfig.scopes
      },
    });
    
    signIn.on('afterRender', function (context) {
      console.log('signIn on afterRender context',context)
      setWidgetActiveContext({ ...context, loading: false })
      
      if(context.formName === "terminal"){
        let errorString = document.querySelector('.o-form-error-container')?.innerHTML
        if(errorString.includes("You have been logged out due to inactivity")){
          reloadLoginPage()
        }
      }
    })
    
    signIn.showSignIn().then(function(result) {
      console.log('showSignIn then',result)
      signIn.remove()
      console.log('result.tokens',result.tokens)
      console.log(authClient)
      authClient.tokenManager.setTokens(result.tokens)
    }).catch(async function(error) {
      console.error(error)
      console.error('error.name',error.name)
      
      if(error?.name === 'AuthApiError'){
        console.log('error?.xhr',error?.xhr)
        
        if(!error?.xhr?.responseText){
          console.log('no auth api error response found')
          return
        }
        let responseJson
        try{
          responseJson = JSON.parse(error.xhr.responseText)
        }catch(err){      
          document.getElementById("error").innerHTML = 'Error Logging In! <BR /><B>'+error.xhr.responseText+'</B><BR />via showSignIn catch error<BR /><button onclick="location.reload()">Refresh Page</button>'
          return
        }
        
        document.getElementById("error").innerHTML = 'Error Logging In! <BR /><B>'+error.xhr.responseText+'</B><BR />via showSignIn catch error<BR /><button onclick="location.reload()">Refresh Page</button>'
        console.log('responseJson',responseJson)
        if(responseJson?.messages?.value[0]?.i18n?.key ==='idx.session.expired'){
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
      }
    };
    
  }, []);
  
  function reloadLoginPage(){
    window.location = window.location.origin + '/#login';
  }

  return (
    <div className="container mt-4 page-transition">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <widgetActiveContextContext.Provider value={widgetActiveContext}>
            <div className="text-center mb-4">
              <h2 className="neon-text">NEURAL ACCESS GATEWAY</h2>
              <p className="lead">Initiating biometric verification sequence</p>
              <div className="retro-separator"></div>
            </div>
            {widgetActiveContext?.loading ? (
              <div className="loading-container">
                <div className="quantum-spinner">
                  <div className="spinner-inner"></div>
                  <div className="spinner-text neon-text-purple">QUANTUM AUTHENTICATION</div>
                </div>
              </div>
            ) : (
              <>
                <LogMeInButton/>
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