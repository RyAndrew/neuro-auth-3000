const widgetActiveContextContext = React.createContext(null)

const Login = () => {
  const { 
    authState, 
    authClient, 
    oktaConfig, 
    updateOktaConfig,
    currentAuthType,
    currentAuthServer,
    currentClassicMode,
    updateAuthType,
    updateAuthServer,
    updateClassicMode,
    getConfigForAuthServer
  } = useAuthContext()
  
  const [widgetActiveContext, setWidgetActiveContext] = React.useState({ loading: true })
  const [postLoginLoading, setPostLoginLoading] = React.useState(false)
  
  const { addLog, LOG_TYPES } = useDebugLog()
  
  const widgetRef = React.useRef(null)
  const signInRef = React.useRef(null)

  // Function to handle restart needed callback from LoginTransactionTimer
  const handleTransactionRestartNeeded = React.useCallback(() => {
    addLog(LOG_TYPES.INFO, 'Restarting login process after transaction expiration')
    
    // Get current configuration and reinitialize widget completely
    const newConfig = getConfigForAuthServer(currentAuthServer, currentClassicMode)
    reinitializeWidget(newConfig, currentAuthType)
  }, [currentAuthServer, currentClassicMode, currentAuthType, getConfigForAuthServer]) // Removed addLog and LOG_TYPES

  // Function to reinitialize the widget
  const reinitializeWidget = (newConfig, typeValue = currentAuthType) => {
    addLog(LOG_TYPES.INFO, 'Reinitializing Okta widget with new configuration')
    
    // Remove existing widget if it exists
    if (signInRef.current) {
      try {
        signInRef.current.remove()
      } catch (err) {
        console.error('Error removing existing widget', err)
      }
      signInRef.current = null
    }

    // If redirect mode, don't create widget
    if (typeValue === 'redirect') {
      setWidgetActiveContext({ loading: false })
      return
    }

    // Reset widget context to loading state
    setWidgetActiveContext({ loading: true })

    // Create new widget with updated config
    setTimeout(() => {
      const signIn = new OktaSignIn({
        ...newConfig,
        authClient: authClient,
        baseUrl: window.location.origin + '/#login',
        el: widgetRef.current,
      })
      
      signInRef.current = signIn
      
      signIn.on('afterRender', function (context) {
        console.log('signIn on afterRender context',context)
        addLog(LOG_TYPES.LOGIN, 'Sign-in widget rendered', { formName: context.formName })
        setWidgetActiveContext({ ...context, loading: false })
        
        if(context.formName === "terminal"){
          let errorString = document.querySelector('.o-form-error-container')?.innerHTML
          if(errorString?.includes("You have been logged out due to inactivity")){
            addLog(LOG_TYPES.LOGOUT, 'Transaction expired due to inactivity')
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
            addLog(LOG_TYPES.LOGOUT, 'Transaction expired')
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
    }, 100) // Small delay to ensure DOM is ready
  }

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

    // Handle redirect callback - check if this is a redirect from Okta
    if (authClient.isLoginRedirect()) {
      addLog(LOG_TYPES.LOGIN, 'Processing redirect callback')
      authClient.token.parseFromUrl()
        .then((data) => {
          addLog(LOG_TYPES.LOGIN, 'Redirect callback processed successfully')
          console.log('Redirect tokens received:', data.tokens)
          authClient.tokenManager.setTokens(data.tokens)
          // The parseFromUrl method should clean up the URL automatically
          window.location = window.location.origin + '/#home';
        })
        .catch((error) => {
          addLog(LOG_TYPES.ERROR, `Redirect callback error: ${error.message}`)
          console.error('Redirect callback error:', error)
        })
      return;
    }

    console.log('app useeffect once authtype=', currentAuthType)
    if(currentAuthType === 'redirect'){
      setWidgetActiveContext({ loading: false })
      return
    } 

    const signIn = new OktaSignIn({
      ...oktaConfig,
      authClient: authClient,
      baseUrl: window.location.origin + '/#login',
      el: widgetRef.current,
      features:{
        autoFocus: false,
      }
    });
    
    signInRef.current = signIn
    
    signIn.on('afterRender', function (context) {
      console.log('signIn on afterRender context',context)
      addLog(LOG_TYPES.LOGIN, 'Sign-in widget rendered', { formName: context.formName })
      setWidgetActiveContext({ ...context, loading: false })
      
      if(context.formName === "terminal"){
        let errorString = document.querySelector('.o-form-error-container')?.innerHTML
        if(errorString?.includes("You have been logged out due to inactivity")){
          addLog(LOG_TYPES.LOGOUT, 'Transaction expired due to inactivity')
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
          addLog(LOG_TYPES.LOGOUT, 'Transaction expired')
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

  const handleAuthTypeChange = (e) => {
    const newType = e.target.value
    updateAuthType(newType) // Use provider method
    addLog(LOG_TYPES.INFO, `Auth type changed to: ${newType}`)
    
    // Get current configuration from provider for the current auth server and classic mode
    const newConfig = getConfigForAuthServer(currentAuthServer, currentClassicMode)
    
    reinitializeWidget(newConfig, newType)
  }

  const handleAuthServerChange = (e) => {
    const newServer = e.target.value
    updateAuthServer(newServer) // Use provider method - this automatically updates the config
    addLog(LOG_TYPES.INFO, `Auth server changed to: ${newServer}`)
    
    // Get the new configuration from provider
    const newConfig = getConfigForAuthServer(newServer, currentClassicMode)
    
    // Update the provider's authClient with new config (if needed for compatibility)
    if (updateOktaConfig) {
      updateOktaConfig(newConfig)
      addLog(LOG_TYPES.INFO, 'Provider authClient updated with new auth server configuration')
    }
    
    // Only reinitialize if not in redirect mode
    if (currentAuthType !== 'redirect') {
      reinitializeWidget(newConfig)
    }
  }

  const handleClassicModeChange = (e) => {
    const newClassicMode = e.target.checked
    updateClassicMode(newClassicMode) // Use provider method - this automatically updates the config
    addLog(LOG_TYPES.INFO, `Classic mode changed to: ${newClassicMode}`)
    
    // Get the new configuration from provider
    const newConfig = getConfigForAuthServer(currentAuthServer, newClassicMode)
    
    // Update the provider's authClient with new config (if needed for compatibility)
    if (updateOktaConfig) {
      updateOktaConfig(newConfig)
      addLog(LOG_TYPES.INFO, 'Provider authClient updated with new classic mode configuration')
    }
    
    // Only reinitialize if not in redirect mode
    if (currentAuthType !== 'redirect') {
      reinitializeWidget(newConfig)
    }
  }

  const handleClickRedirectButton = () => {
    addLog(LOG_TYPES.LOGIN, 'Initiating redirect login')
    authClient.signInWithRedirect()
      .then(() => {
        addLog(LOG_TYPES.LOGIN, 'Redirect initiated successfully')
      })
      .catch((error) => {
        addLog(LOG_TYPES.ERROR, `Redirect login error: ${error.message}`)
        console.error('Redirect login error:', error)
      })
  }

  const totpSeed = getTotpSeed()

  // Calculate if timer should be active
  const isTimerActive = !widgetActiveContext.loading && 
                       currentAuthType !== 'redirect'

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
            ) : currentAuthType === 'redirect' ? (
              <div className="text-center my-4">
                <button 
                  className="btn btn-lg px-5 py-3 login-redirect-button"
                  onClick={handleClickRedirectButton}
                >
                  ⚡ Login 🔑
                </button>
              </div>
            ) : (
              <>
                <LogMeInButton totpSeed={totpSeed}/>
                <TotpButton totpSeed={totpSeed}/>
              </>
            )}
            {currentAuthType !== 'redirect' && (
              <div className={currentAuthType === 'custom' ? 'okta-widget-theme-vaporwave' : ''} ref={widgetRef}></div>
            )}
            <div id="error"></div>
          </widgetActiveContextContext.Provider>

          {/* Authentication Configuration Dropdowns */}
          <div className="row mb-4 mt-4">
            <div className="col-md-6">
              <div className="row">
                <div className="col-sm-3">
                  <label htmlFor="authType" className="col-form-label neon-text">Type</label>
                </div>
                <div className="col-sm-9">
                  <select 
                    id="authType"
                    className="form-select cyber-select"
                    value={currentAuthType}
                    onChange={handleAuthTypeChange}
                  >
                    <option value="custom">Embedded Custom</option>
                    <option value="vanilla">Embedded Vanilla</option>
                    <option value="redirect">Redirect</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="row">
                <div className="col-sm-6">
                  <label htmlFor="authServer" className="col-form-label neon-text">Auth Server</label>
                </div>
                <div className="col-sm-6">
                  <select 
                    id="authServer"
                    className="form-select cyber-select-blue"
                    value={currentAuthServer}
                    onChange={handleAuthServerChange}
                  >
                    <option value="custom">Custom</option>
                    <option value="default">Default</option>
                    <option value="org">Org</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Classic Mode Checkbox */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="form-check">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="classicMode"
                  checked={currentClassicMode}
                  onChange={handleClassicModeChange}
                />
                <label className="form-check-label neon-text" htmlFor="classicMode">
                  Classic Mode (useClassicEngine)
                </label>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-muted">SYSTEM VERSION 3.7.9 // CLASSIFIED // AUTHORIZED PERSONNEL ONLY</p>
          </div>
        </div>
      </div>

      {/* Login Transaction Timer - handles both monitoring and expiration modal */}
      <LoginTransactionTimer 
        authClient={authClient}
        isActive={isTimerActive}
        onRestartNeeded={handleTransactionRestartNeeded}
        addLog={addLog}
        LOG_TYPES={LOG_TYPES}
      />
    </div>
  );
};