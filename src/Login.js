const widgetActiveContextContext = React.createContext(null)

const Login = () => {
  const { authState, authClient } = useAuthContext()
  const [widgetActiveContext, setWidgetActiveContext] = React.useState(null)
  
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
        //pkce: oktaConfig.pkce,
        issuer: oktaConfig.issuer,
        //responseType: ['code'],
        scopes: oktaConfig.scopes
      },
      //useInteractionCodeFlow: true,
      
      // customButtons: [
      //   {
      //     title: 'Need help?',
      //     className: 'btn-customAuth',
      //     click: function() {
      //       alert('SYSTEM NOTICE: Neural Interface Technicians are standing by. Please contact the mainframe administrator.');
      //     }
      //   }
      // ]
    });
    
    
    signIn.on('afterRender', function (context) {
      
      console.log('signIn on afterRender context',context)
      
      setWidgetActiveContext(Object.assign({}, context))
      
      if(context.formName === "terminal"){
        let errorString = document.querySelector('.o-form-error-container')?.innerHTML
        if(errorString.includes("You have been logged out due to inactivity")
           // || errorString.includes("There was an unexpected internal error") // this triggers on config errors and may show user a reloading loop
          ){ 
          //location.reload()
          reloadLoginPage()
        }
      }
    })
    
    signIn.showSignIn().then(function(result) {
    console.log('showSignIn then',result)
    
    //hide widget
    signIn.remove()
    
//    checkOktaSession()
    
//    hideElement("loading-container")
    
    console.log('result.tokens',result.tokens)
    console.log(authClient)
    authClient.tokenManager.setTokens(result.tokens)
    
  }).catch(async function(error) {
    console.error(error)
    console.error('error.name',error.name)
    //catch errors from the token request
    
    //this error is most commonly caused by the state token being invalid after 1 hour so clear it and try again
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
        //location.reload()
        reloadLoginPage()
      }
      console.log('AuthApiError detected :(')
      authClient.transactionManager.clear()
      await authClient.idx.cancel()
      //location.reload()
      reloadLoginPage()
      return
    }
    
    if(error?.name === 'CONFIG_ERROR'){
      await authClient.idx.cancel()
      //location.reload()
      reloadLoginPage()
      return
    }
    
    //hide loading spinner
    //hideElement("loading-container")
    
    //show error msg
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
          <widgetActiveContextContext.Provider  value={widgetActiveContext}>
            <div className="text-center mb-4">
              <h2 className="neon-text">NEURAL ACCESS GATEWAY</h2>
              <p className="lead">Initiating biometric verification sequence</p>
              <div className="retro-separator"></div>
            </div>
            <LogMeInButton/>
            <MfaButton totpSeed={totpSeed}/>
            {/* Login widget container */}
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