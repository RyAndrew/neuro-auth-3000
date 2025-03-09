const Perlin = function() {
  this.perm = (() => {
    const tmp = Array.from({ length: 256 }, () => Math.floor(Math.random() * 256));
    return tmp.concat(tmp)
  })();
  
  this.grad = function(i, x) {
    const h = i & 0xf;
    const grad = 1 + (h & 7);
    return ((h & 8) !== 0) ? -grad * x : grad * x;
  };
  
  this.getValue = function(x) {
    const i0 = Math.floor(x);
    const i1 = i0 + 1;
    
    const x0 = x - i0;
    const x1 = x0 - 1;
    
    let t0 = 1 - x0 * x0;
    t0 *= t0;
    
    let t1 = 1 - x1 * x1;
    t1 *= t1;
    
    const n0 = t0 * t0 * this.grad(this.perm[i0 & 0xff], x0);
    const n1 = t1 * t1 * this.grad(this.perm[i1 & 0xff], x1);
    
    return 0.395 * (n0 + n1);
  };
}

const sample = [
  0.03, 0.03, 0.03, 0.04, 0.07, 0.23, 0.18, 0.5, 0.85, 1,
  0.78, 0.7, 0.5, 0.3, 0.12, 0.07, 0.23, 0.5, 0.58, 0.4,
  0.2, 0.13, 0.05, 0.15, 0.2, 0.15, 0.12, 0.08, 0.05, 0.04,
  0.03, 0.03, 0.04, 0.03, 0.03
];

const TARGET_FPS = 5; // We'll target 30fps for smooth animation
const FRAME_DURATION = 1000 / TARGET_FPS;

const VisualizationAudio = () => {
  const spectrumRef = React.useRef(null);
  const segmentsRef = React.useRef([]);
  const animationFrameRef = React.useRef(null);
  const noiseRef = React.useRef(null);
  const baseValuesRef = React.useRef([]);
  const lastFrameTimeRef = React.useRef(0);

  React.useEffect(() => {
    if (!spectrumRef.current) return;

    // Create segments and store them in a document fragment first
    const fragment = document.createDocumentFragment();
    sample.forEach((_, i) => {
      const segment = document.createElement('div');
      segment.classList.add('spectrum-segment');
      segmentsRef.current[i] = segment;
      fragment.appendChild(segment);
    });
    // Single DOM operation to add all segments
    spectrumRef.current.appendChild(fragment);

    // Create the noise generator and precalculate base values
    noiseRef.current = new Perlin();
    baseValuesRef.current = sample.map((_, i) => {
      return (noiseRef.current.getValue(i * 0.1) + 1) / 2;
    });

    // Function to update segment values
    const updateSegments = (timestamp) => {
      // Control frame rate
      if (timestamp - lastFrameTimeRef.current < FRAME_DURATION) {
        animationFrameRef.current = requestAnimationFrame(updateSegments);
        return;
      }

      // Update last frame time
      lastFrameTimeRef.current = timestamp;

      // Batch transform updates
      segmentsRef.current.forEach((segmentElement, i) => {
        let value = 
          baseValuesRef.current[i]
          * Math.random()
          * sample[i]
          * 1.5;
        
        value = value < 0.01 ? 0.01 : value;
        
        // Use transform3d for hardware acceleration
        segmentElement.style.transform = `scale3d(1, ${value}, 1)`;
      });

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(updateSegments);
    };

    // Start the animation
    animationFrameRef.current = requestAnimationFrame(updateSegments);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (spectrumRef.current) {
        spectrumRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="visualizer-container">
      <div className="spectrum" ref={spectrumRef}></div>
    </div>
  );
}; 