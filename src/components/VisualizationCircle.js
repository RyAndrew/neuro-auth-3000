const VisualizationCircle = () => {
  const sketchRef = React.useRef(null);
  const p5Ref = React.useRef(null);
  const [wavelength, setWavelength] = React.useState(128);
  const [velocity, setVelocity] = React.useState(0.5);
  const [amplitude, setAmplitude] = React.useState(0.8);
  const [clearInterval, setClearInterval] = React.useState(30);
  const [undulateWavelength, setUndulateWavelength] = React.useState(false);
  const [undulateVelocity, setUndulateVelocity] = React.useState(false);
  const [undulateAmplitude, setUndulateAmplitude] = React.useState(false);
  const timeRef = React.useRef(0);
  const settingsRef = React.useRef({ wavelength, velocity, amplitude, clearInterval });
  const lastClearRef = React.useRef(0);
  const undulationRef = React.useRef({
    wavelength: Math.random() * 10000,
    velocity: Math.random() * 10000,
    amplitude: Math.random() * 10000
  });

  React.useEffect(() => {
    settingsRef.current = { wavelength, velocity, amplitude, clearInterval };
  }, [wavelength, velocity, amplitude, clearInterval]);

  // Handle undulation animations
  React.useEffect(() => {
    let animationFrameId;
    
    const updateUndulations = () => {
      if (undulateWavelength) {
        undulationRef.current.wavelength += 0.02;
        const newValue = 128 + Math.sin(undulationRef.current.wavelength) * 127;
        setWavelength(newValue);
      }
      if (undulateVelocity) {
        undulationRef.current.velocity += 0.015;
        const newValue = 1 + Math.sin(undulationRef.current.velocity) * 0.8;
        setVelocity(newValue);
      }
      if (undulateAmplitude) {
        undulationRef.current.amplitude += 0.01;
        const newValue = 0.55 + Math.sin(undulationRef.current.amplitude) * 0.45;
        setAmplitude(newValue);
      }

      if (undulateWavelength || undulateVelocity || undulateAmplitude) {
        animationFrameId = requestAnimationFrame(updateUndulations);
      }
    };

    if (undulateWavelength || undulateVelocity || undulateAmplitude) {
      animationFrameId = requestAnimationFrame(updateUndulations);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [undulateWavelength, undulateVelocity, undulateAmplitude]);

  const handleRecalibrate = () => {
    if (p5Ref.current) {
      p5Ref.current.clear();
      lastClearRef.current = timeRef.current;
      
      // Randomize all values
      setWavelength(Math.random() * 255);
      setVelocity(Math.random() * 2);
      setAmplitude(0.1 + Math.random() * 0.9); // Keep between 0.1 and 1
      setClearInterval(5 + Math.floor(Math.random() * 12) * 5); // Steps of 5 between 5 and 60
      
      // Randomly toggle undulation states
      setUndulateWavelength(Math.random() > 0.5);
      setUndulateVelocity(Math.random() > 0.5);
      setUndulateAmplitude(Math.random() > 0.5);
      
      // Reset undulation phases to random values
      undulationRef.current = {
        wavelength: Math.random() * 10000,
        velocity: Math.random() * 10000,
        amplitude: Math.random() * 10000
      };
    }
  };

  const drawPerlinCircle = (p, rotation) => {
    p.push();
    p.rotate(rotation);
    p.beginShape();
    for (let i = 0; i < 200; i++) {
      const ang = p.map(i, 0, 200, 0, p.TWO_PI);
      const baseRadius = Math.min(p.width, p.height) * 0.79 * amplitude;
      const rad = baseRadius * p.noise(i * 0.01, timeRef.current * 0.005);
      const x = rad * p.cos(ang);
      const y = rad * p.sin(ang);
      p.curveVertex(x, y);
    }
    p.endShape(p.CLOSE);
    p.pop();
  };

  React.useEffect(() => {
    const sketch = (p) => {
      p.setup = () => {
        const container = sketchRef.current;
        const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
        canvas.parent(sketchRef.current);
        p.colorMode(p.HSB, 255);
        if (!p5Ref.current) {
          p.clear();
          lastClearRef.current = timeRef.current;
        }
        p.noFill();
      };

      p.draw = () => {
        const { wavelength, velocity, amplitude, clearInterval } = settingsRef.current;
        
        if (timeRef.current - lastClearRef.current > clearInterval * 20) {
          p.clear();
          lastClearRef.current = timeRef.current;
        }

        p.stroke(wavelength, 200, 255, 15);
        p.translate(p.width/2, p.height/2);
        
        // Draw 4 rotated instances
        for (let i = 0; i < 4; i++) {
          drawPerlinCircle(p, (p.TWO_PI / 4) * i);
        }

        timeRef.current += velocity;
      };

      p.windowResized = () => {
        const container = sketchRef.current;
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      };
    };

    if (!p5Ref.current) {
      p5Ref.current = new p5(sketch);
    }

    return () => {
      if (p5Ref.current) {
        p5Ref.current.remove();
      }
    };
  }, []);

  return (
    <div className="perlin-circle">
      <div className="canvas-container" ref={sketchRef}></div>
      <div className="controls-wrapper">
        <div className="controls">
          <div className="control-group">
            <div className="control-item">
              <label className="control-label">Wavelength</label>
              <div className="control-input-group">
                <input
                  className="control-slider"
                  type="range"
                  min="0"
                  max="255"
                  value={wavelength}
                  onChange={(e) => setWavelength(Number(e.target.value))}
                  disabled={undulateWavelength}
                />
                <input
                  type="checkbox"
                  checked={undulateWavelength}
                  onChange={(e) => setUndulateWavelength(e.target.checked)}
                  className="control-checkbox"
                />
              </div>
            </div>
            <div className="control-item">
              <label className="control-label">Velocity</label>
              <div className="control-input-group">
                <input
                  className="control-slider"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={velocity}
                  onChange={(e) => setVelocity(Number(e.target.value))}
                  disabled={undulateVelocity}
                />
                <input
                  type="checkbox"
                  checked={undulateVelocity}
                  onChange={(e) => setUndulateVelocity(e.target.checked)}
                  className="control-checkbox"
                />
              </div>
            </div>
            <div className="control-item">
              <label className="control-label">Amplitude</label>
              <div className="control-input-group">
                <input
                  className="control-slider"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={amplitude}
                  onChange={(e) => setAmplitude(Number(e.target.value))}
                  disabled={undulateAmplitude}
                />
                <input
                  type="checkbox"
                  checked={undulateAmplitude}
                  onChange={(e) => setUndulateAmplitude(e.target.checked)}
                  className="control-checkbox"
                />
              </div>
            </div>
            <div className="control-item">
              <label className="control-label">Interval</label>
              <input
                className="control-slider"
                type="range"
                min="5"
                max="60"
                step="5"
                value={clearInterval}
                onChange={(e) => setClearInterval(Number(e.target.value))}
              />
            </div>
            <button 
              className="recalibrate-btn"
              onClick={handleRecalibrate}
            >
              Recalibrate Matrix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 