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
              
  return (
    <div className="totp-button container mt-3">
      <div className="d-flex align-items-center flex-nowrap">
        <div className="me-2">
          <button 
            className="btn btn-retro btn-retro-primary totp-button"
            type="button" 
            onClick={clickMfa}
          >
            MFA
          </button>
        </div>
        <div className="flex-grow-1 d-flex">
          <input 
            type="text" 
            className="form-control mfa-totp-textfield border-0 rounded-0 flex-grow-1" 
            value={totpResult} 
            readOnly 
            aria-label="TOTP result"
          />
          <button 
            className="btn btn-retro btn-retro-secondary btn-retro-copy rounded-0"
            type="button" 
            onClick={copyToClipboard}
            disabled={!totpResult}
            title="Copy TOTP code"
          >📋</button>
        </div>
      </div>
    </div>
  );
};