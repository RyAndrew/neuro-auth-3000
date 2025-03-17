const DebugLogContext = React.createContext();

const LOG_TYPES = {
  INFO: 'info',
  ERROR: 'error',
  LOGIN: 'login',
  LOGOUT: 'logout',
  TOKEN_REFRESH: 'token_refresh'
};

const DebugLogProvider = ({ children }) => {
  const [logs, setLogs] = React.useState([]);

  // Load logs from localStorage on mount
  React.useEffect(() => {
    const savedLogs = localStorage.getItem('debugLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Save logs to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('debugLogs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (type, message, details = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      message: String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      details: details ? JSON.stringify(details) : null
    };
    
    setLogs(prev => {
      const newLogs = [...prev, logEntry];
      // Keep only the last 2000 logs
      return newLogs.slice(-2000);
    });
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('debugLogs');
  };

  // Override console methods to capture logs
  React.useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      addLog(LOG_TYPES.INFO, args.join(' '));
    };
    
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      addLog(LOG_TYPES.ERROR, args.join(' '));
    };
    
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      addLog(LOG_TYPES.INFO, args.join(' '));
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return (
    <DebugLogContext.Provider value={{ logs, addLog, clearLogs, LOG_TYPES }}>
      {children}
    </DebugLogContext.Provider>
  );
};

const useDebugLog = () => {
  const context = React.useContext(DebugLogContext);
  if (!context) {
    throw new Error('useDebugLog must be used within a DebugLogProvider');
  }
  return context;
}; 