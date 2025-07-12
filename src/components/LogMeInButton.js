let globalWidgetContext

const LogMeInButton = function({totpSeed}){
  
 const widgetContext = React.useContext(widgetActiveContextContext)
 const [localWidgetContext, setLocalWidgetContext] = React.useState(null)
 const { addLog, LOG_TYPES } = useDebugLog()

 // State machine states
 const LOGIN_STATES = {
   IDLE: 'idle',
   IDENTIFIER_STEP: 'identifier_step',
   PASSWORD_STEP: 'password_step', 
   MFA_SELECTOR_STEP: 'mfa_selector_step',
   MFA_CHALLENGE_STEP: 'mfa_challenge_step',
   COMPLETED: 'completed',
   CANCELLED: 'cancelled'
 }

 const [loginState, setLoginState] = React.useState(LOGIN_STATES.IDLE)
 const [startTime, setStartTime] = React.useState(null)
 const timeoutRef = React.useRef(null)

 React.useEffect(() => {
   console.log('useEffect widgetContext ',widgetContext)
   setLocalWidgetContext(widgetContext)
   globalWidgetContext = widgetContext
   
   // Handle state transitions based on widget context changes
   if (loginState !== LOGIN_STATES.IDLE && loginState !== LOGIN_STATES.COMPLETED && loginState !== LOGIN_STATES.CANCELLED) {
     handleStateTransition(widgetContext)
   }
  }, [widgetContext]);
  
  
  function handleStateTransition(context) {
    if (!context || context.loading) return
    
    addLog(LOG_TYPES.INFO, `Widget context updated during login`, { 
      formName: context.formName, 
      controller: context.controller,
      currentState: loginState 
    })

    // Check for timeout
    if (startTime && Date.now() - startTime > 10000) {
      addLog(LOG_TYPES.ERROR, 'Auto-login cancelled due to 10 second timeout')
      cancelAutoLogin()
      return
    }

    // State machine transitions
    switch(loginState) {
      case LOGIN_STATES.IDENTIFIER_STEP:
        // Handle transitions from identifier-only, combined, and classic forms
        if (context.formName === 'challenge-authenticator' && context.authenticatorKey === 'okta_password') {
          addLog(LOG_TYPES.LOGIN, 'Transitioning to password step')
          setLoginState(LOGIN_STATES.PASSWORD_STEP)
          setTimeout(() => handlePasswordStep(), 500)
        } else if (context.formName === 'select-authenticator-authenticate') {
          addLog(LOG_TYPES.LOGIN, 'Transitioning to MFA selector step from combined form')
          setLoginState(LOGIN_STATES.MFA_SELECTOR_STEP)
          setTimeout(() => handleMfaSelectorStep(), 500)
        } else if (context.formName === 'challenge-authenticator' && context.controller === 'mfa-verify') {
          addLog(LOG_TYPES.LOGIN, 'Transitioning to MFA challenge step from combined form')
          setLoginState(LOGIN_STATES.MFA_CHALLENGE_STEP)
          setTimeout(() => handleMfaChallengeStep(), 500)
        } else if (context.controller === 'mfa-verify' || context.controller?.includes('mfa')) {
          // Classic mode MFA detection
          addLog(LOG_TYPES.LOGIN, 'Transitioning to MFA step from classic form')
          setLoginState(LOGIN_STATES.MFA_CHALLENGE_STEP)
          setTimeout(() => handleMfaChallengeStep(), 500)
        }
        break
        
      case LOGIN_STATES.PASSWORD_STEP:
        if (context.formName === 'select-authenticator-authenticate') {
          addLog(LOG_TYPES.LOGIN, 'Transitioning to MFA selector step')
          setLoginState(LOGIN_STATES.MFA_SELECTOR_STEP)
          setTimeout(() => handleMfaSelectorStep(), 500)
        } else if (context.formName === 'challenge-authenticator' && context.controller === 'mfa-verify') {
          addLog(LOG_TYPES.LOGIN, 'Transitioning to MFA challenge step')
          setLoginState(LOGIN_STATES.MFA_CHALLENGE_STEP)
          setTimeout(() => handleMfaChallengeStep(), 500)
        }
        break
        
      case LOGIN_STATES.MFA_SELECTOR_STEP:
        if (context.formName === 'challenge-authenticator' && context.controller === 'mfa-verify') {
          addLog(LOG_TYPES.LOGIN, 'Transitioning to MFA challenge step')
          setLoginState(LOGIN_STATES.MFA_CHALLENGE_STEP)
          setTimeout(() => handleMfaChallengeStep(), 500)
        }
        break
    }
  }

  async function clickLogMeIn(){
    addLog(LOG_TYPES.LOGIN, 'Auto-login initiated', { context: localWidgetContext })
    
    logMeInButtonDisabled(true)
    setStartTime(Date.now())
    
    // Set 10 second timeout
    timeoutRef.current = setTimeout(() => {
      addLog(LOG_TYPES.ERROR, 'Auto-login cancelled due to timeout')
      cancelAutoLogin()
    }, 10000)
    
    // Detect current form state and start appropriate step
    if (detectClassicCombinedForm()) {
      addLog(LOG_TYPES.LOGIN, 'Starting with classic mode combined form')
      setLoginState(LOGIN_STATES.IDENTIFIER_STEP) // Reuse this state for classic form
      await handleClassicCombinedForm()
    } else if (detectCombinedForm()) {
      addLog(LOG_TYPES.LOGIN, 'Starting with combined username+password form')
      setLoginState(LOGIN_STATES.IDENTIFIER_STEP) // Reuse this state for combined form
      await handleCombinedForm()
    } else if (detectIdentifierForm()) {
      addLog(LOG_TYPES.LOGIN, 'Starting with identifier step')
      setLoginState(LOGIN_STATES.IDENTIFIER_STEP)
      await handleIdentifierStep()
    } else if (detectPasswordForm()) {
      addLog(LOG_TYPES.LOGIN, 'Starting with password step')
      setLoginState(LOGIN_STATES.PASSWORD_STEP)
      await handlePasswordStep()
    } else if (detectMfaSelectorForm()) {
      addLog(LOG_TYPES.LOGIN, 'Starting with MFA selector step')
      setLoginState(LOGIN_STATES.MFA_SELECTOR_STEP)
      await handleMfaSelectorStep()
    } else if (detectMfaChallengeForm()) {
      addLog(LOG_TYPES.LOGIN, 'Starting with MFA challenge step')
      setLoginState(LOGIN_STATES.MFA_CHALLENGE_STEP)
      await handleMfaChallengeStep()
    } else {
      addLog(LOG_TYPES.ERROR, 'Unknown form state - cancelling auto-login')
      cancelAutoLogin()
    }
  }

  // Field detection functions
  function detectClassicCombinedForm() {
    // Classic mode uses different selectors
    return document.querySelector('#okta-signin-username') !== null && 
           document.querySelector('#okta-signin-password') !== null
  }

  function detectCombinedForm() {
    // Both username and password fields exist on same form (modern)
    return document.querySelector('input[name="identifier"]') !== null && 
           document.querySelector('input[name="credentials.passcode"]') !== null
  }

  function detectIdentifierForm() {
    // Only identifier field exists (identifier-first flow)
    return document.querySelector('input[name="identifier"]') !== null && 
           document.querySelector('input[name="credentials.passcode"]') === null
  }

  function detectPasswordForm() {
    return document.querySelector('input[name="credentials.passcode"]') !== null && 
           localWidgetContext?.authenticatorKey === 'okta_password'
  }

  function detectMfaSelectorForm() {
    return localWidgetContext?.formName === 'select-authenticator-authenticate'
  }

  function detectMfaChallengeForm() {
    return document.querySelector('input[name="credentials.passcode"]') !== null && 
           localWidgetContext?.controller === 'mfa-verify' &&
           localWidgetContext?.authenticatorKey !== 'okta_password'
  }

  // Step handlers
  async function handleClassicCombinedForm() {
    addLog(LOG_TYPES.LOGIN, 'Handling classic mode combined form')
    
    // Fill username (classic mode selector)
    const userField = document.querySelector('#okta-signin-username')
    if (!userField) {
      addLog(LOG_TYPES.ERROR, 'Username field not found in classic form')
      cancelAutoLogin()
      return
    }

    const userVal = "test@test.com"
    if (userField.value !== userVal) {
      await simulateTyping(userField, userVal)
      addLog(LOG_TYPES.LOGIN, 'Username entered in classic form')
    }

    // Fill password (classic mode selector)
    const passField = document.querySelector('#okta-signin-password')
    if (!passField) {
      addLog(LOG_TYPES.ERROR, 'Password field not found in classic form')
      cancelAutoLogin()
      return
    }

    await simulateTyping(passField, "Secret123$")
    addLog(LOG_TYPES.LOGIN, 'Password entered in classic form')

    // Submit classic form - classic mode typically uses different submit selector
    let submitBtn = document.querySelector('input[type="submit"]') || 
                    document.querySelector('button[type="submit"]') || 
                    document.querySelector('.okta-form-submit-btn') ||
                    document.querySelector('input.button-primary[type="submit"]')
    
    if (submitBtn) {
      addLog(LOG_TYPES.LOGIN, 'Submitting classic form')
      submitBtn.click()
      
      // In classic form, next step could be MFA or completion
      setTimeout(() => {
        // Check if we need to handle MFA in classic mode
        if (loginState === LOGIN_STATES.IDENTIFIER_STEP) {
          // Classic mode MFA detection might be different - wait for context update
          setTimeout(() => {
            if (!detectClassicCombinedForm() && !detectCombinedForm() && !detectIdentifierForm()) {
              // Assume login completed if no more forms detected
              completeAutoLogin()
            }
          }, 2000)
        }
      }, 1000)
    } else {
      addLog(LOG_TYPES.ERROR, 'Submit button not found for classic form')
      cancelAutoLogin()
    }
  }

  async function handleCombinedForm() {
    addLog(LOG_TYPES.LOGIN, 'Handling combined username+password form')
    
    // Fill username
    const userField = document.querySelector('input[name="identifier"]')
    if (!userField) {
      addLog(LOG_TYPES.ERROR, 'Username field not found in combined form')
      cancelAutoLogin()
      return
    }

    const userVal = "test@test.com"
    if (userField.value !== userVal) {
      await simulateTyping(userField, userVal)
      addLog(LOG_TYPES.LOGIN, 'Username entered in combined form')
    }

    // Fill password
    const passField = document.querySelector('input[name="credentials.passcode"]')
    if (!passField) {
      addLog(LOG_TYPES.ERROR, 'Password field not found in combined form')
      cancelAutoLogin()
      return
    }

    await simulateTyping(passField, "Secret123$")
    addLog(LOG_TYPES.LOGIN, 'Password entered in combined form')

    // Submit combined form
    const submitBtn = document.querySelector('input.button-primary[type="submit"]')
    if (submitBtn) {
      addLog(LOG_TYPES.LOGIN, 'Submitting combined form')
      submitBtn.click()
      
      // In combined form, next step could be MFA or completion
      // Wait for form transition to determine next step
      setTimeout(() => {
        // The handleStateTransition will catch the next form state
        if (loginState === LOGIN_STATES.IDENTIFIER_STEP) {
          // If we're still in this state after submission, check for MFA
          if (detectMfaSelectorForm() || detectMfaChallengeForm()) {
            // State machine will handle this in useEffect
          } else {
            // Login might be complete
            setTimeout(() => completeAutoLogin(), 2000)
          }
        }
      }, 1000)
    } else {
      addLog(LOG_TYPES.ERROR, 'Submit button not found for combined form')
      cancelAutoLogin()
    }
  }

  async function handleIdentifierStep() {
    addLog(LOG_TYPES.LOGIN, 'Handling identifier step')
    
    const userField = document.querySelector('input[name="identifier"]')
    if (!userField) {
      addLog(LOG_TYPES.ERROR, 'Identifier field not found')
      cancelAutoLogin()
      return
    }

    const userVal = "test@test.com"
    if (userField.value !== userVal) {
      await simulateTyping(userField, userVal)
      addLog(LOG_TYPES.LOGIN, 'Username entered')
    }

    // Submit identifier form
    const submitBtn = document.querySelector('input.button-primary[type="submit"]')
    if (submitBtn) {
      addLog(LOG_TYPES.LOGIN, 'Submitting identifier form')
      submitBtn.click()
    } else {
      addLog(LOG_TYPES.ERROR, 'Submit button not found for identifier form')
      cancelAutoLogin()
    }
  }

  async function handlePasswordStep() {
    addLog(LOG_TYPES.LOGIN, 'Handling password step')
    
    const passField = document.querySelector('input[name="credentials.passcode"]')
    if (!passField) {
      addLog(LOG_TYPES.ERROR, 'Password field not found')
      cancelAutoLogin()
      return
    }

    await simulateTyping(passField, "Secret123$")
    addLog(LOG_TYPES.LOGIN, 'Password entered')

    // Submit password form
    const submitBtn = document.querySelector('input.button-primary[type="submit"]')
    if (submitBtn) {
      addLog(LOG_TYPES.LOGIN, 'Submitting password form')
      submitBtn.click()
    } else {
      addLog(LOG_TYPES.ERROR, 'Submit button not found for password form')
      cancelAutoLogin()
    }
  }

  async function handleMfaSelectorStep() {
    addLog(LOG_TYPES.LOGIN, 'Handling MFA selector step')
    
    const googleAuthSelector = document.querySelector('a[aria-label="Select Google Authenticator."]')
    if (googleAuthSelector) {
      addLog(LOG_TYPES.LOGIN, 'Selecting Google Authenticator')
      googleAuthSelector.click()
    } else {
      addLog(LOG_TYPES.ERROR, 'Google Authenticator selector not found')
      cancelAutoLogin()
    }
  }

  async function handleMfaChallengeStep() {
    addLog(LOG_TYPES.LOGIN, 'Handling MFA challenge step')
    
    // Click visual TOTP button if present
    const totpBtn = document.querySelector("button.totp-button")
    if (totpBtn) {
      totpBtn.click()
      addLog(LOG_TYPES.LOGIN, 'TOTP button clicked')
    }

    // Try multiple selectors for TOTP field (modern vs classic)
    let codeField = document.querySelector('input[name="credentials.passcode"]') || // Modern
                    document.querySelector('#okta-signin-passcode') ||              // Classic
                    document.querySelector('input[name="passcode"]') ||             // Alternative
                    document.querySelector('input[type="tel"]')                     // TOTP fields are often tel type

    if (!codeField) {
      addLog(LOG_TYPES.ERROR, 'TOTP field not found - tried multiple selectors')
      cancelAutoLogin()
      return
    }

    const totpCode = await totp(totpSeed)
    await simulateTyping(codeField, totpCode)
    addLog(LOG_TYPES.LOGIN, 'TOTP code entered')

    // Submit MFA form - try multiple submit button selectors
    let submitBtn = document.querySelector('input.button-primary[type="submit"]') ||    // Modern
                    document.querySelector('input[type="submit"]') ||                    // Classic
                    document.querySelector('button[type="submit"]') ||                   // Alternative
                    document.querySelector('.okta-form-submit-btn')                      // Classic alternative

    if (submitBtn) {
      addLog(LOG_TYPES.LOGIN, 'Submitting MFA form')
      submitBtn.click()
      
      // Complete the login process
      setTimeout(() => {
        setLoginState(LOGIN_STATES.COMPLETED)
        completeAutoLogin()
      }, 1000)
    } else {
      addLog(LOG_TYPES.ERROR, 'Submit button not found for MFA form')
      cancelAutoLogin()
    }
  }

  function completeAutoLogin() {
    addLog(LOG_TYPES.LOGIN, 'Auto-login completed successfully')
    logMeInButtonDisabled(false)
    setLoginState(LOGIN_STATES.IDLE)
    clearTimeout(timeoutRef.current)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelAutoLogin() {
    addLog(LOG_TYPES.ERROR, 'Auto-login cancelled')
    logMeInButtonDisabled(false)
    setLoginState(LOGIN_STATES.CANCELLED)
    clearTimeout(timeoutRef.current)
    
    // Reset to idle after a brief delay
    setTimeout(() => {
      setLoginState(LOGIN_STATES.IDLE)
    }, 2000)
  }

  function logMeInButtonDisabled(status){ 
    const btn = document.getElementById('logMeIn')
    if (btn) {
      btn.disabled = status
    }
  }

  async function simulateTyping(field, text) {
    field.focus()
    const len = text.length;
    for(let i = 1; i <= len; i++) {
      field.value = text.slice(0,i)
      await new Promise(resolve => setTimeout(resolve, 90))
    }
    field.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }))
  }
  
  return (
    <div className="logmein-button container mt-3">
      <div className="row">
        <div className="col-12">
            <button 
              className="btn btn-retro btn-retro-primary" 
              type="button" 
              id="logMeIn"
              onClick={clickLogMeIn}
            >
              ✨ Log Me In ✨
            </button>
        </div>
      </div>
    </div>
  );
};