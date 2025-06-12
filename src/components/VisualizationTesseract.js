const VisualizationTesseract = ({ verticalOffsetPercent = 20 }) => {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const angleRef = React.useRef(0);
  const verticesRef = React.useRef([]);
  const lastFrameTimeRef = React.useRef(0);
  
  // Interaction state
  const interactionRef = React.useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0,
    rotationOffsetX: 0,
    rotationOffsetY: 0,
    rotationOffsetZ: 0,
    rotationOffsetW: 0,
    momentum: 0.95, // Momentum decay factor
    sensitivity: 0.01 // Drag sensitivity
  });
  
  const targetFPS = 50;
  const frameInterval = 1000 / targetFPS;

  // Initialize vertices of the tesseract
  const initVertices = () => {
    const vertices = [];
    for (let i = 0; i < 16; i++) {
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

  // Get mouse/touch position relative to canvas
  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Handle interaction start (mouse down / touch start)
  const handleInteractionStart = React.useCallback((e) => {
    e.preventDefault();
    const pos = getEventPos(e);
    const interaction = interactionRef.current;
    
    interaction.isDragging = true;
    interaction.lastX = pos.x;
    interaction.lastY = pos.y;
    interaction.velocityX = 0;
    interaction.velocityY = 0;
    
    // Visual feedback - could add canvas cursor change here
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
  }, []);

  // Handle interaction move (mouse move / touch move)
  const handleInteractionMove = React.useCallback((e) => {
    e.preventDefault();
    const interaction = interactionRef.current;
    
    if (!interaction.isDragging) return;
    
    const pos = getEventPos(e);
    const deltaX = pos.x - interaction.lastX;
    const deltaY = pos.y - interaction.lastY;
    
    // Update velocities for momentum
    interaction.velocityX = deltaX * interaction.sensitivity;
    interaction.velocityY = deltaY * interaction.sensitivity;
    
    // Update rotation offsets based on drag
    interaction.rotationOffsetX += deltaX * interaction.sensitivity;
    interaction.rotationOffsetY += deltaY * interaction.sensitivity;
    
    // Add some cross-dimensional rotation for more interesting interaction
    interaction.rotationOffsetZ += (deltaX * 0.3 + deltaY * 0.2) * interaction.sensitivity;
    interaction.rotationOffsetW += (deltaX * 0.2 - deltaY * 0.4) * interaction.sensitivity;
    
    interaction.lastX = pos.x;
    interaction.lastY = pos.y;
  }, []);

  // Handle interaction end (mouse up / touch end)
  const handleInteractionEnd = React.useCallback((e) => {
    e.preventDefault();
    const interaction = interactionRef.current;
    
    interaction.isDragging = false;
    
    // Visual feedback
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  }, []);

  // Setup canvas resolution to match CSS display size (for crisp rendering)
  const setupCanvas = React.useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get the actual rendered size of the canvas (after CSS is applied)
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set internal canvas resolution to match CSS display size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the drawing context to account for device pixel ratio
    ctx.scale(dpr, dpr);
    
    // Enable antialiasing for smoother lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Set line join and cap for better line quality
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    return { width: rect.width, height: rect.height, dpr };
  }, []);

  // Handle resize to make canvas responsive
  const handleResize = React.useCallback(() => {
    setupCanvas();
  }, [setupCanvas]);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initial setup
    const canvasInfo = setupCanvas();
    if (!canvasInfo) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set initial cursor
    canvas.style.cursor = 'grab';
    
    // Add event listeners for mouse interaction
    canvas.addEventListener('mousedown', handleInteractionStart);
    canvas.addEventListener('mousemove', handleInteractionMove);
    canvas.addEventListener('mouseup', handleInteractionEnd);
    canvas.addEventListener('mouseleave', handleInteractionEnd);
    
    // Add event listeners for touch interaction
    canvas.addEventListener('touchstart', handleInteractionStart, { passive: false });
    canvas.addEventListener('touchmove', handleInteractionMove, { passive: false });
    canvas.addEventListener('touchend', handleInteractionEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleInteractionEnd, { passive: false });
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    const baseRotationSpeed = 0.008; // Slower base rotation when not interacting
    
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
    const draw = (currentTime) => {
      // Frame rate limiting for better performance
      if (currentTime - lastFrameTimeRef.current < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTimeRef.current = currentTime;

      const rect = canvas.getBoundingClientRect();
      if (!rect) return;
      
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      const interaction = interactionRef.current;
      
      // Apply momentum when not dragging
      if (!interaction.isDragging) {
        interaction.velocityX *= interaction.momentum;
        interaction.velocityY *= interaction.momentum;
        
        interaction.rotationOffsetX += interaction.velocityX;
        interaction.rotationOffsetY += interaction.velocityY;
        interaction.rotationOffsetZ += (interaction.velocityX * 0.3 + interaction.velocityY * 0.2);
        interaction.rotationOffsetW += (interaction.velocityX * 0.2 - interaction.velocityY * 0.4);
      }
      
      // Current angle (base rotation continues slowly)
      const baseAngle = angleRef.current;
      
      // Combined rotation angles (base + user interaction)
      const angleXY = baseAngle + interaction.rotationOffsetX;
      const angleXZ = baseAngle * 0.5 + interaction.rotationOffsetY;
      const angleXW = baseAngle * 0.3 + interaction.rotationOffsetW * 0.5;
      const angleYZ = baseAngle * 0.2 + interaction.rotationOffsetZ * 0.3;
      const angleYW = baseAngle * 0.4 + interaction.rotationOffsetX * 0.4;
      const angleZW = baseAngle * 0.6 + interaction.rotationOffsetW;
      
      // Projected vertices
      const projected3D = [];
      
      // First, rotate in 4D and project to 3D
      for (let i = 0; i < verticesRef.current.length; i++) {
        const v = verticesRef.current[i].slice();
        
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
      const verticalOffset = (rect.height * verticalOffsetPercent) / 100;
      ctx.translate(rect.width / 2, rect.height / 2 + verticalOffset);
      
      // Use responsive scale based on canvas size
      const scale = Math.min(rect.width, rect.height) * 0.4;
      
      // Draw each edge with enhanced interactivity effects
      for (let i = 0; i < edges.length; i++) {
        const a = edges[i][0];
        const b = edges[i][1];
        const v1 = projected3D[a];
        const v2 = projected3D[b];
        
        // Project from 3D to 2D (perspective projection)
        const distance3D = 4;
        const w1 = 1 / (distance3D - v1[2]);
        const w2 = 1 / (distance3D - v2[2]);
        
        // Round coordinates to avoid subpixel positioning
        const x1 = Math.round(v1[0] * w1 * scale);
        const y1 = Math.round(v1[1] * w1 * scale);
        const x2 = Math.round(v2[0] * w2 * scale);
        const y2 = Math.round(v2[1] * w2 * scale);
        
        // Calculate color based on edge's position in 4D space
        const edgeZ = (v1[2] + v2[2]) / 2;
        const edgeW = (verticesRef.current[a][3] + verticesRef.current[b][3]) / 2;
        
        // Enhanced color calculation with interaction feedback
        const interactionIntensity = Math.min(Math.abs(interaction.velocityX) + Math.abs(interaction.velocityY), 1);
        const colorBase = interaction.isDragging ? 1.2 : 1.0 + interactionIntensity * 0.3;
        
        const colorR = map(Math.sin(edgeZ * 0.5 + baseAngle), -1, 1, 80, 230) * colorBase;
        const colorG = map(Math.cos(edgeW * 0.6 + baseAngle * 1.2), -1, 1, 80, 230) * colorBase;
        const colorB = map(Math.sin(baseAngle * 0.3 + edgeZ * edgeW), -1, 1, 180, 255) * colorBase;
        
        // Set stroke weight based on depth and interaction
        const depth = (v1[2] + v2[2]) / 2;
        const baseWeight = map(depth, -1, 1, 1, 2.5);
        const interactionWeight = interaction.isDragging ? 1.3 : 1.0 + interactionIntensity * 0.2;
        const weight = baseWeight * interactionWeight;
        
        // Enhanced opacity during interaction
        const baseOpacity = 0.85;
        const interactionOpacity = interaction.isDragging ? 0.95 : baseOpacity + interactionIntensity * 0.1;
        
        // Draw the edge
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = weight;
        ctx.strokeStyle = `rgba(${Math.round(Math.min(colorR, 255))}, ${Math.round(Math.min(colorG, 255))}, ${Math.round(Math.min(colorB, 255))}, ${interactionOpacity})`;
        ctx.stroke();
      }
      
      // Restore the transformation matrix
      ctx.restore();
      
      // Increment base angle for automatic rotation (slower when interacting)
      const rotationMultiplier = interaction.isDragging ? 0.3 : 1.0;
      angleRef.current += baseRotationSpeed * rotationMultiplier;
      
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
      
      // Remove event listeners
      canvas.removeEventListener('mousedown', handleInteractionStart);
      canvas.removeEventListener('mousemove', handleInteractionMove);
      canvas.removeEventListener('mouseup', handleInteractionEnd);
      canvas.removeEventListener('mouseleave', handleInteractionEnd);
      canvas.removeEventListener('touchstart', handleInteractionStart);
      canvas.removeEventListener('touchmove', handleInteractionMove);
      canvas.removeEventListener('touchend', handleInteractionEnd);
      canvas.removeEventListener('touchcancel', handleInteractionEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, handleInteractionStart, handleInteractionMove, handleInteractionEnd]);

  return (
    <div className="tesseract-visualizer-container" ref={containerRef}>
      <canvas ref={canvasRef} className="tesseract-canvas" />
    </div>
  );
};