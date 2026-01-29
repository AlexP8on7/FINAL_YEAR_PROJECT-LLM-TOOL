import React, { useEffect, useRef } from 'react';

function AdvancedSpinner() {
  const ringGroupsRef = useRef([]);
  const ringsRef = useRef([]);
  const solidCirclesRef = useRef([]);
  const size = 100;
  const sizePx = `${size}px`;
  const halfway = size / 2;
  const viewBox = `0 0 ${size} ${size}`;
  const rotationFix = `rotate(-90,${halfway},${halfway})`;
  
  const rings = [
    { color: "hsl(223, 90%, 50%)", radius: 48, rotationStart: 0, rotationEnd: 270, strokeWidth: 4 },
    { color: "hsl(283, 90%, 50%)", radius: 38, rotationStart: 0, rotationEnd: 540, strokeWidth: 3 },
    { color: "hsl(343, 90%, 50%)", radius: 31, rotationStart: 0, rotationEnd: 135, strokeWidth: 2 },
    { color: "hsl(43, 90%, 60%)", radius: 26, rotationStart: 0, rotationEnd: 63, strokeWidth: 2 },
    { color: "hsl(223, 90%, 50%)", radius: 21, rotationStart: 0, rotationEnd: 63, strokeWidth: 2 },
    { color: "hsla(223, 90%, 90%, 0.5)", radius: 5, rotationStart: 0, rotationEnd: 135, strokeWidth: 2 }
  ];
  
  const solidCircles = [
    { color: "hsla(223, 90%, 50%, 0.5)", radius: 15 },
    { color: "hsla(223, 90%, 50%, 0.5)", radius: 15 }
  ];
  
  const duration = 4000;
  const iterations = Infinity;

  const circumference = (radius) => 2 * Math.PI * radius;
  const easings = {
    easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    linear: "linear"
  };

  useEffect(() => {
    // Ring rotation
    ringGroupsRef.current.forEach((el, i) => {
      if (!el) return;
      const { rotationStart, rotationEnd } = rings[i];
      const rotationInc = (rotationEnd - rotationStart) / 2;
      const transform = [];
      
      for (let k = 0; k < 3; k++) {
        transform.push(`rotate(${rotationStart + rotationInc * k}deg)`);
      }
      
      el.animate({ transform }, { duration, easing: easings.linear, iterations });
    });

    // Ring stroke
    ringsRef.current.forEach((el, i) => {
      if (!el) return;
      const { radius } = rings[i];
      const keyframes = [];
      
      for (let k = 0; k < 3; k++) {
        const strokeDashoffset = circumference(-radius * k);
        keyframes.push({ strokeDashoffset, easing: easings.easeInOut });
      }
      
      el.animate(keyframes, { duration, iterations });
    });

    // Solid circles
    solidCirclesRef.current.forEach((el, i) => {
      if (!el) return;
      const indexIsEven = i % 2 === 0;
      const keyframes = [];
      
      for (let k = 0; k < 3; k++) {
        const scaleA = indexIsEven ? 1 : 0;
        const scaleB = indexIsEven ? 0 : 1;
        const scale = k === 1 ? scaleA : scaleB;
        keyframes.push({ transform: `scale(${scale})`, easing: easings.easeInOut });
      }
      
      el.animate(keyframes, { duration, iterations });
    });
  }, []);

  return (
    <svg
      className="advanced-spinner"
      viewBox={viewBox}
      width={sizePx}
      height={sizePx}
      style={{ margin: '0 auto', display: 'block' }}
    >
      <g transform={rotationFix}>
        {solidCircles.map((circle, i) => (
          <circle
            key={`solid-${i}`}
            ref={el => solidCirclesRef.current[i] = el}
            r={circle.radius}
            cx={halfway}
            cy={halfway}
            fill={circle.color}
            style={{ transformOrigin: `${halfway}px ${halfway}px` }}
          />
        ))}
        {rings.map((ring, i) => (
          <g
            key={`ring-${i}`}
            ref={el => ringGroupsRef.current[i] = el}
            style={{ transformOrigin: `${halfway}px ${halfway}px` }}
          >
            <circle
              ref={el => ringsRef.current[i] = el}
              r={ring.radius}
              cx={halfway}
              cy={halfway}
              fill="none"
              strokeDasharray={`${circumference(ring.radius)} ${circumference(ring.radius)}`}
              stroke={ring.color}
              strokeWidth={ring.strokeWidth}
              transform={`rotate(${ring.rotationStart},${halfway},${halfway})`}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

export default AdvancedSpinner;