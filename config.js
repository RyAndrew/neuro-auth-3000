const oktaConfig = {
  clientId: '0oapkxrbm34SQC9NT697',  
  issuer: 'https://dev-5069239.okta.com',
  redirectUri: window.location.origin + '/login',
  scopes: ['openid', 'profile', 'email','phone'],
}

const totpSeed = 'PG7YVBG4AYFSDEL3'