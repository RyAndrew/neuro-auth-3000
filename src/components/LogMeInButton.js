let globalWidgetContext

const LogMeInButton = function({totpSeed}){
  
 const widgetContext = React.useContext(widgetActiveContextContext)
 const [localWidgetContext, setLocalWidgetContext] = React.useState(null)

 React.useEffect(() => {
   console.log('useEffect widgetContext ',widgetContext)
   setLocalWidgetContext(widgetContext)
   globalWidgetContext = widgetContext
  }, [widgetContext]);
  
  
  async function clickLogMeIn(){
    console.log('clickLogMeIn localWidgetContext', localWidgetContext)
    
    logMeInButtonDisabled(true)
    
    if(localWidgetContext?.controller === 'mfa-verify' && localWidgetContext?.formName ==='challenge-authenticator'){
      autofillMfaAndSubmit()
      return
    }

    //if you have an existing session you go straight to the password or mfa inputs and entering user and agreeing to terms can be skipped
    if(localWidgetContext?.controller === 'primary-auth' && localWidgetContext?.formName ==='identify' ){
      //input user name
      let user = document.querySelector('input[name="identifier"]')
      let userVal = "test@test.com";
      //check for autofill
      if(user.value !== userVal){
        await simulateTyping(user,"test@test.com") 
      }

      //check agree to terms
      //document.querySelector("input#tandc").checked = true
    }

    //input password
    let pass = document.querySelector('input[name="credentials.passcode"]')
    await simulateTyping(pass,"Secret123$")

    //click the appropriate button based on the form type
    if(localWidgetContext?.controller === 'primary-auth' && localWidgetContext?.formName ==='identify' ){
      //click log on button
      //let event = new Event("click", { bubbles: true, cancelable: true })
      //event.detail=1
      //document.querySelector("a.sign-in-clone.default-custom-button").dispatchEvent(event)
      document.querySelector('input.button-primary[type="submit"]').click()
    }
    if(localWidgetContext?.formName === 'challenge-authenticator' ){
      document.querySelector('input.button-primary[type="submit"]').click()
    }
        
    //wait 2 seconds to input mfa
    window.setTimeout(()=>{handleMfaSelector()},3000)
  }
  function handleMfaSelector(){
    // console.log('handleMfaSelector autofillMfaAndSubmit localWidgetContext', localWidgetContext)
    // console.log('localWidgetContext?.formName', localWidgetContext?.formName)
    // console.log('localWidgetContext?.formName === select-authenticator-authenticate', localWidgetContext?.formName ==='select-authenticator-authenticate')

    // console.log('handleMfaSelector autofillMfaAndSubmit globalWidgetContext', globalWidgetContext)
    // console.log('globalWidgetContext?.formName', globalWidgetContext?.formName)
    // console.log('globalWidgetContext?.formName === select-authenticator-authenticate', globalWidgetContext?.formName ==='select-authenticator-authenticate')

      //if you dont have the authenticator cookie set you have to select one first
      if(globalWidgetContext?.formName ==='select-authenticator-authenticate'){
        clickGoogleAuthenticator()
        return
      }

      autofillMfaAndSubmit()
  }
  function clickGoogleAuthenticator(){
    document.querySelector('a[aria-label="Select Google Authenticator."]').click()

    window.setTimeout(autofillMfaAndSubmit,600)
  }
  async function autofillMfaAndSubmit(){
      //click mfa button just for visuals
      document.querySelector("button.totp-button").click()
    
    console.log('autofillMfaAndSubmit localWidgetContext', localWidgetContext)

      let codeField = document.querySelector('input[name="credentials.passcode"]')
      if(!codeField){
        console.error('totp field not found - quitting auto login')
        logMeInButtonDisabled(false)
        return false
      }
      await simulateTyping(codeField,await totp(totpSeed))

      document.querySelector('input.button-primary[type="submit"]').click()

      //after logging in, scroll to the top of the page
      window.setTimeout(()=>{
        logMeInButtonDisabled(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },1000)

  }
  function logMeInButtonDisabled(status){ 
    document.getElementById('logMeIn').disabled = status
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