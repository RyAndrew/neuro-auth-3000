const DebugLog = () => {
  const [showModal, setShowModal] = React.useState(false);
  const { logs, clearLogs } = useDebugLog();
  
  const getLogClass = (type) => {
    switch(type) {
      case LOG_TYPES.ERROR:
        return 'text-danger';
      case LOG_TYPES.LOGIN:
        return 'text-success';
      case LOG_TYPES.LOGOUT:
        return 'text-warning';
      case LOG_TYPES.TOKEN_REFRESH:
        return 'text-info';
      default:
        return 'text-light';
    }
  };

  const getLogIcon = (type) => {
    switch(type) {
      case LOG_TYPES.ERROR:
        return '❌';
      case LOG_TYPES.LOGIN:
        return '🔑';
      case LOG_TYPES.LOGOUT:
        return '🚪';
      case LOG_TYPES.TOKEN_REFRESH:
        return '🔄';
      default:
        return 'ℹ️';
    }
  };
  
  return (
    <>
      <div className="h-100 d-flex flex-column">
        <div className="flex-grow-1 d-flex flex-column">
          <button 
            className="btn btn-retro btn-retro-primary w-100" 
            type="button"
            onClick={() => setShowModal(true)}
          >
            Debug
          </button>
        </div>
      </div>
      
      {showModal && (
        <div className="modal show d-block debug-log-modal" tabIndex="-1">
          <div className="modal-dialog modal-fullscreen debug-log-dialog">
            <div className="modal-content bg-dark debug-log-content">
              <div className="modal-header border-secondary debug-log-header">
                <h5 className="modal-title neon-text">System Debug</h5>
                <div className="ms-auto me-2 d-flex">
                  <button
                    className="btn btn-retro btn-retro-danger me-2"
                    onClick={clearLogs}
                  >
                    🗑️ Clear
                  </button>
                  <button
                    className="btn btn-retro btn-retro-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    ❌ Close
                  </button>
                </div>
              </div>
              <div className="modal-body">
                <div className="debug-log-container">
                  {[...logs].reverse().map((log, index) => (
                    <div key={index} className="debug-log-entry">
                      <span className="neon-text-purple debug-log-timestamp">
                        [{util.convertUtcStringToDateTimeString(log.timestamp)}]
                      </span>
                      <span className={`${getLogClass(log.type)} debug-log-type`}>
                        {getLogIcon(log.type)} [{log.type.toUpperCase()}]
                      </span>
                      <span className="text-light debug-log-message">
                        {log.message}
                      </span>
                      {log.details && (
                        <div className="debug-log-details text-muted">
                          {log.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 