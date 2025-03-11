const TotpButton = ({totpSeed}) => {
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

  const copyToClipboard = () => {
    if (totpResult) {
      navigator.clipboard.writeText(totpResult);
    }
  };
  //<i className="bi bi-clipboard"></i>
              
  return (
    <div className="totp-button container mt-3">
      <div className="row g-2 align-items-center">
        <div className="col-12 col-sm-auto mb-2 mb-sm-0">
          <button 
            className="btn btn-retro btn-retro-primary totp-button w-100" 
            type="button" 
            onClick={clickMfa}
          >
            Generate TOTP
          </button>
        </div>
        <div className="col-12 col-sm-auto">
          <div className="row g-0">
            <div className="col-8">
              <input 
                type="text" 
                className="form-control mfa-totp-textfield border-0 rounded-0" 
                value={totpResult} 
                readOnly 
                aria-label="TOTP result"
              />
            </div>
            <div className="col-4">
              <button 
                className="btn btn-retro btn-retro-secondary w-100 rounded-0" 
                type="button" 
                onClick={copyToClipboard}
                disabled={!totpResult}
                title="Copy TOTP code"
              >📋</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 