import React, { useEffect, useState, useRef } from 'react';

interface Dice3DProps {
  value: number;
  isRolling: boolean;
  onComplete?: () => void;
}

const Dice3D: React.FC<Dice3DProps> = ({ value, isRolling, onComplete }) => {
  // Use state for the actual CSS transform string
  const [transformStyle, setTransformStyle] = useState('rotateX(0deg) rotateY(0deg)');
  
  // Use refs to store the CUMULATIVE rotation. 
  // This prevents the dice from snapping back to 0 before rotating.
  const rotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only trigger animation when isRolling becomes true
    if (isRolling) {
      // Correct Mapping based on initial CSS:
      // Face 1 (Front): Y=0
      // Face 2 (Left):  Y=90 (Rotate Cube Y+90 shows Left Face)
      // Face 3 (Top):   X=-90 (Rotate Cube X-90 shows Top Face)
      // Face 4 (Bottom): X=90 (Rotate Cube X+90 shows Bottom Face)
      // Face 5 (Right): Y=-90 (Rotate Cube Y-90 shows Right Face)
      // Face 6 (Back):  Y=180
      
      const targetRotations: Record<number, {x: number, y: number}> = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: 90 }, 
        3: { x: -90, y: 0 }, // Fixed: Top Face
        4: { x: 90, y: 0 },  // Fixed: Bottom Face
        5: { x: 0, y: -90 },
        6: { x: 180, y: 0 }, 
      };
      
      const target = targetRotations[value] || { x: 0, y: 0 };

      // Current accumulated rotation
      const currentX = rotationRef.current.x;
      const currentY = rotationRef.current.y;

      // Add minimum full spins (e.g., 2 to 4 full rotations) to ensure animation visual
      // Randomize slightly so it doesn't look robotic
      const spinsX = 2 + Math.floor(Math.random() * 3); 
      const spinsY = 2 + Math.floor(Math.random() * 3);

      // Algorithm to find next forward angle that matches target modulus 360
      const calculateNextAngle = (current: number, targetMod: number, minSpins: number) => {
        // 1. Normalize current angle to 0-360 context relative to rotation (keep sign effectively)
        // Actually, just find the remainder.
        const modCurrent = current % 360;
        
        // 2. Calculate distance to target in forward direction
        let delta = targetMod - modCurrent;
        
        // If delta is negative (e.g. want 90, current is 100 -> -10), 
        // we add 360 to ensure we move FORWARD to the next matching angle
        // (e.g. 100 -> 360+90 = 450. 450-100 = 350 rotation)
        // If delta is positive (e.g. want 100, current 90 -> 10), 
        // we might still want to add full spins.
        
        // Normalize delta to be strictly positive (0 to 360) representing forward movement to target alignment
        if (delta < 0) {
            delta += 360;
        }
        
        // 3. Add base spins (360 * minSpins) + delta
        return current + (minSpins * 360) + delta;
      };

      const nextX = calculateNextAngle(currentX, target.x, spinsX);
      const nextY = calculateNextAngle(currentY, target.y, spinsY);

      // Update the ref so the next roll starts from here
      rotationRef.current = { x: nextX, y: nextY };

      // Apply style
      setTransformStyle(`rotateX(${nextX}deg) rotateY(${nextY}deg)`);

      // Trigger completion callback matches CSS transition duration
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000); // Must match transition duration below

      return () => clearTimeout(timer);
    }
  }, [isRolling, value]);

  return (
    <div className="scene">
      <div 
        className="cube" 
        style={{ 
          transform: transformStyle
        }}
      >
        <div className="cube__face cube__face--1">
            <div className="dot center"></div>
        </div>
        <div className="cube__face cube__face--2">
            <div className="dot top-right"></div>
            <div className="dot bottom-left"></div>
        </div>
        <div className="cube__face cube__face--3">
            <div className="dot top-right"></div>
            <div className="dot center"></div>
            <div className="dot bottom-left"></div>
        </div>
        <div className="cube__face cube__face--4">
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
        </div>
        <div className="cube__face cube__face--5">
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot center"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
        </div>
        <div className="cube__face cube__face--6">
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot middle-left"></div>
            <div className="dot middle-right"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
        </div>
      </div>

      <style>{`
        .scene {
          width: 80px;
          height: 80px;
          perspective: 600px;
          margin: 0 auto;
        }

        .cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          /* ease-out makes it start fast and slow down to a stop, simulating friction */
          transition: transform 2s cubic-bezier(0.15, 0.9, 0.35, 1); 
        }

        .cube__face {
          position: absolute;
          width: 80px;
          height: 80px;
          background: linear-gradient(145deg, #ffffff, #f0f0f0);
          border: 1px solid #ccc;
          border-radius: 16px; /* Slightly rounder for modern look */
          box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
          line-height: 80px;
          font-size: 40px;
          font-weight: bold;
          color: #333;
          text-align: center;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          padding: 8px;
          backface-visibility: hidden; /* Helps performance */
        }

        /* 
           Standard Dice Mapping:
           1 opposite 6
           2 opposite 5
           3 opposite 4
           
           CSS Transforms to build the cube shape:
        */
        .cube__face--1  { transform: rotateY(   0deg) translateZ(40px); }
        .cube__face--6  { transform: rotateY( 180deg) translateZ(40px); }
        
        .cube__face--2  { transform: rotateY( -90deg) translateZ(40px); }
        .cube__face--5  { transform: rotateY(  90deg) translateZ(40px); }
        
        .cube__face--3  { transform: rotateX( -90deg) translateZ(40px); }
        .cube__face--4  { transform: rotateX(  90deg) translateZ(40px); }

        .dot {
            background-color: #3b82f6; /* Blue dots */
            border-radius: 50%;
            width: 14px;
            height: 14px;
            box-shadow: inset 1px 1px 3px rgba(0,0,0,0.3);
            margin: auto;
        }
        
        /* Specific override for the 1 dot (Red is traditional in Asian dice, lets stick to Red/Blue scheme) */
        .cube__face--1 .dot { 
            background-color: #ef4444; 
            width: 22px; 
            height: 22px; 
        }

        /* Dot Positioning */
        .center { grid-area: 2 / 2; }
        .top-left { grid-area: 1 / 1; }
        .top-right { grid-area: 1 / 3; }
        .middle-left { grid-area: 2 / 1; }
        .middle-right { grid-area: 2 / 3; }
        .bottom-left { grid-area: 3 / 1; }
        .bottom-right { grid-area: 3 / 3; }
      `}</style>
    </div>
  );
};

export default Dice3D;