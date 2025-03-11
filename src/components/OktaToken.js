const OktaToken = () => {
  const { authState } = useAuthContext();
  
  // Don't render anything while auth state is loading
  if (authState.isLoading) {
    return null;
  }

  const formatExpiration = (exp) => {
    if (!exp) return 'N/A';
    const date = new Date(exp * 1000);
    return util.convertUtcStringToDateTimeString(date.toISOString());
  };

  return (
    <div className="h-100 d-flex flex-column">
      <div className="flex-grow-1 d-flex flex-column">
        <div className="mb-2">
          <span className="neon-text">Access Token: </span>
          {authState.tokens?.accessToken ? (
            <span className="neon-text-purple">
              Expires {formatExpiration(authState.tokens.accessToken.expiresAt)}
            </span>
          ) : (
            <span className="neon-text-pink">Not Available</span>
          )}
        </div>
        <div>
          <span className="neon-text">Refresh Token: </span>
          {authState.tokens?.refreshToken ? (
            <span className="neon-text-purple">
              Expires {formatExpiration(authState.tokens.refreshToken.expiresAt)}
            </span>
          ) : (
            <span className="neon-text-pink">Not Available</span>
          )}
        </div>
      </div>
    </div>
  );
};