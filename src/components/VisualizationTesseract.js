const VisualizationTesseract = ({ verticalOffsetPercent = 20 }) => {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const angleRef = React.useRef(0);
  const verticesRef = React.useRef([]);
  
  // Initialize vertices of the tesseract
  const initVertices = () => {
    const vertices = [];
    for (let i = 0; i < 16; i++) {
      // Convert binary representation to determine coordinates
      // Each vertex is at either -1 or 1 in each dimension
      vertices[i] = [
        ((i & 1) ? 1 : -1),
        ((i & 2) ? 1 : -1),
        ((i & 4) ? 1 : -1),
        ((i & 8) ? 1 : -1)
      ];
    }
    return vertices;
  };

  // Map value from one range to another
  const map = (value, inMin, inMax, outMin, outMax) => {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  };

  // Handle resize to make canvas responsive
  const handleResize = React.useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Get the container's dimensions
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Set canvas size to match container
    canvasRef.current.width = rect.width;
    canvasRef.current.height = rect.height;
  }, []);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initial resize
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Make scale responsive to container size
    const getScale = () => Math.min(canvas.width, canvas.height) * 0.35;
    const rotationSpeed = 0.03;
    
    // Tesseract edges (32 edges)
    const edges = [
      [0, 1], [0, 2], [0, 4], [0, 8],
      [1, 3], [1, 5], [1, 9],
      [2, 3], [2, 6], [2, 10],
      [3, 7], [3, 11],
      [4, 5], [4, 6], [4, 12],
      [5, 7], [5, 13],
      [6, 7], [6, 14],
      [7, 15],
      [8, 9], [8, 10], [8, 12],
      [9, 11], [9, 13],
      [10, 11], [10, 14],
      [11, 15],
      [12, 13], [12, 14],
      [13, 15],
      [14, 15]
    ];

    // Initialize vertices
    verticesRef.current = initVertices();

    // Draw function for animation
    const draw = () => {
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Current angle
      const angle = angleRef.current;
      
      // Rotation angles in different 4D planes
      const angleXY = angle;
      const angleXZ = angle * 0.5;
      const angleXW = angle * 0.3;
      const angleYZ = angle * 0.2;
      const angleYW = angle * 0.4;
      const angleZW = angle * 0.6;
      
      // Projected vertices
      const projected3D = [];
      
      // First, rotate in 4D and project to 3D
      for (let i = 0; i < verticesRef.current.length; i++) {
        const v = verticesRef.current[i].slice(); // Copy the vertex
        
        // Apply 4D rotations on various planes
        
        // XY rotation
        let x = v[0];
        let y = v[1];
        v[0] = x * Math.cos(angleXY) - y * Math.sin(angleXY);
        v[1] = x * Math.sin(angleXY) + y * Math.cos(angleXY);
        
        // XZ rotation
        x = v[0];
        let z = v[2];
        v[0] = x * Math.cos(angleXZ) - z * Math.sin(angleXZ);
        v[2] = x * Math.sin(angleXZ) + z * Math.cos(angleXZ);
        
        // XW rotation
        x = v[0];
        let w = v[3];
        v[0] = x * Math.cos(angleXW) - w * Math.sin(angleXW);
        v[3] = x * Math.sin(angleXW) + w * Math.cos(angleXW);
        
        // YZ rotation
        y = v[1];
        z = v[2];
        v[1] = y * Math.cos(angleYZ) - z * Math.sin(angleYZ);
        v[2] = y * Math.sin(angleYZ) + z * Math.cos(angleYZ);
        
        // YW rotation
        y = v[1];
        w = v[3];
        v[1] = y * Math.cos(angleYW) - w * Math.sin(angleYW);
        v[3] = y * Math.sin(angleYW) + w * Math.cos(angleYW);
        
        // ZW rotation
        z = v[2];
        w = v[3];
        v[2] = z * Math.cos(angleZW) - w * Math.sin(angleZW);
        v[3] = z * Math.sin(angleZW) + w * Math.cos(angleZW);
        
        // Project from 4D to 3D (perspective projection)
        const distance4D = 2;
        const w4 = 1 / (distance4D - v[3]);
        const x3 = v[0] * w4;
        const y3 = v[1] * w4;
        const z3 = v[2] * w4;
        
        // Store 3D coordinates
        projected3D[i] = [x3, y3, z3];
      }
      
      // Save the current transformation matrix
      ctx.save();
      
      // Translate to center of canvas with vertical offset
      const verticalOffset = (canvas.height * verticalOffsetPercent) / 100;
      ctx.translate(canvas.width / 2, canvas.height / 2 + verticalOffset);
      
      // Use dynamic scale based on canvas size
      const scale = getScale();
      
      // Draw each edge
      for (let i = 0; i < edges.length; i++) {
        const a = edges[i][0];
        const b = edges[i][1];
        const v1 = projected3D[a];
        const v2 = projected3D[b];
        
        // Project from 3D to 2D (perspective projection)
        const distance3D = 4;
        const w1 = 1 / (distance3D - v1[2]);
        const w2 = 1 / (distance3D - v2[2]);
        
        const x1 = v1[0] * w1 * scale;
        const y1 = v1[1] * w1 * scale;
        const x2 = v2[0] * w2 * scale;
        const y2 = v2[1] * w2 * scale;
        
        // Calculate color based on edge's position in 4D space
        const edgeZ = (v1[2] + v2[2]) / 2;
        const edgeW = (verticesRef.current[a][3] + verticesRef.current[b][3]) / 2;
        
        // Calculate edge color using 4D position - using neon colors to match theme
        const colorR = map(Math.sin(edgeZ * 0.5 + angle), -1, 1, 80, 230);
        const colorG = map(Math.cos(edgeW * 0.6 + angle * 1.2), -1, 1, 80, 230);
        const colorB = map(Math.sin(angle * 0.3 + edgeZ * edgeW), -1, 1, 180, 255);
        
        // Set stroke weight based on depth
        const depth = (v1[2] + v2[2]) / 2;
        const weight = map(depth, -1, 1, 0.8, 2.5);
        
        // Draw the edge
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = weight;
        ctx.strokeStyle = `rgba(${Math.round(colorR)}, ${Math.round(colorG)}, ${Math.round(colorB)}, 0.85)`;
        ctx.stroke();
      }
      
      // Restore the transformation matrix
      ctx.restore();
      
      // Increment angle for animation
      angleRef.current += rotationSpeed;
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(draw);

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div className="tesseract-visualizer-container" ref={containerRef}>
      <canvas ref={canvasRef} className="tesseract-canvas" />
    </div>
  );
};