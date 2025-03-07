const MfaButton = ({totpSeed}) => {
  const [totpResult, setTotpResult] = React.useState('');
   
  async function clickMfa(){
    let result
    try {
      result = await totp(totpSeed)
    }catch(e){
      console.error('error generating totp')
      throw e
    }
    setTotpResult(result)
  }
  
  return (
    <div className="mfa-button container mt-3">
      <div className="row">
        <div className="col-12">
          <div className="input-group">
            <button 
              className="btn btn-retro btn-retro-primary totp-button" 
              type="button" 
              onClick={clickMfa}
            >
              Generate TOTP
            </button>
            <input 
              type="text" 
              className="form-control mfa-totp-textfield" 
              placeholder="TOTP code will appear here" 
              value={totpResult} 
              readOnly 
              aria-label="TOTP result"
            />
          </div>
        </div>
      </div>
    </div>
  );
};