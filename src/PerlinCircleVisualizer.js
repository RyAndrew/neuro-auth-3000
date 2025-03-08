const PerlinCircleVisualizer = () => {
  const sketchRef = React.useRef(null);
  const p5Ref = React.useRef(null);

  React.useEffect(() => {
    // Define the sketch
    const sketch = (p) => {
      let t = 0;

      p.setup = () => {
        const canvas = p.createCanvas(400, 400);
        canvas.parent(sketchRef.current);
        // Set initial transparent background
        p.clear();
        p.stroke(128, 0, 255, 15); // Purple with low opacity
        p.noFill();
      };

      p.draw = () => {
        // Apply transparent background every 1 minute (3600 frames at 60fps)
        if (p.frameCount % 3600 === 0) {
          p.clear(); // This sets a transparent background
        }
        
        p.translate(p.width/2, p.height/2);
        p.beginShape();
        for (let i = 0; i < 200; i++) {
          const ang = p.map(i, 0, 200, 0, p.TWO_PI);
          const baseRadius = Math.min(p.width, p.height) * 0.61; // Use 45% of the smallest canvas dimension
          const rad = baseRadius * p.noise(i * 0.01, t * 0.005);
          const x = rad * p.cos(ang);
          const y = rad * p.sin(ang);
          p.curveVertex(x, y);
        }
        p.endShape(p.CLOSE);

        t += 1;
      };
    };

    // Create new p5 instance
    p5Ref.current = new p5(sketch);

    // Cleanup
    return () => {
      if (p5Ref.current) {
        p5Ref.current.remove();
      }
    };
  }, []);

  return (
    <div className="visualizer-container perlin-circle-container" ref={sketchRef}></div>
  );
}; 