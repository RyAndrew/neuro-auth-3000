const DataManager = () => {
  const { authState } = useAuthContext();
  const [robotData, setRobotData] = React.useState([]);
  const [newEntry, setNewEntry] = React.useState({
    name: '',
    robots: '',
    applications: ''
  });
  
  // Load data from localStorage on component mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('robotData');
    if (savedData) {
      setRobotData(JSON.parse(savedData));
    } else {
      // Initialize with mock data if no saved data exists
      const initialData = [
        { name: "CyberDyne Systems", robots: 247, applications: 156 },
        { name: "RoboTech Industries", robots: 189, applications: 98 },
        { name: "Neural Dynamics", robots: 312, applications: 234 },
        { name: "Quantum Robotics", robots: 156, applications: 89 },
        { name: "SynthCorp", robots: 278, applications: 167 },
        { name: "Automata Solutions", robots: 198, applications: 145 },
        { name: "Binary Beings", robots: 167, applications: 112 },
        { name: "Circuit Systems", robots: 234, applications: 178 }
      ];
      setRobotData(initialData);
      localStorage.setItem('robotData', JSON.stringify(initialData));
    }
  }, []);
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authState.isAuthenticated && !authState.isLoading) {
      location.hash = 'login';
    }
  }, [authState]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRobotData = {
      name: newEntry.name,
      robots: parseInt(newEntry.robots),
      applications: parseInt(newEntry.applications)
    };
    
    const updatedData = [newRobotData, ...robotData];
    setRobotData(updatedData);
    localStorage.setItem('robotData', JSON.stringify(updatedData));
    
    // Reset form
    setNewEntry({
      name: '',
      robots: '',
      applications: ''
    });
  };

  if (authState.isLoading) {
    return (
      <div className="container mt-4 text-center">
        <div className="neon-text-purple" style={{fontSize: "1.5rem"}}>
          LOADING DATA MATRIX...
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container-fluid p-0">
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-dark">
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>ROBOTIC UNITS</th>
                  <th>ACTIVE APPLICATIONS</th>
                </tr>
              </thead>
              <tbody>
                {robotData.map((robot, index) => (
                  <tr key={index}>
                    <td>{robot.name}</td>
                    <td>{robot.robots}</td>
                    <td>{robot.applications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h3 className="card-title neon-text">ADD NEW ENTITY</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label htmlFor="company">COMPANY NAME</label>
              <input
                type="text"
                className="form-control"
                id="company"
                name="name"
                value={newEntry.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="units">ROBOTIC UNITS</label>
              <input
                type="number"
                className="form-control"
                id="units"
                name="robots"
                value={newEntry.robots}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="applications">ACTIVE APPLICATIONS</label>
              <input
                type="number"
                className="form-control"
                id="applications"
                name="applications"
                value={newEntry.applications}
                onChange={handleInputChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-retro btn-retro-primary">
              SAVE TO DATABASE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};