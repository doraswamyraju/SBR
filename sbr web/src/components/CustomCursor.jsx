import React, { useState, useEffect } from 'react';

// --- SVG ICONS (Self-contained, no dependencies) ---
// No specific SVG icons are directly used within CustomCursor's JSX,
// but the ripple/water-drop effects are purely CSS.

// Custom Cursor Component
const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [clickEffects, setClickEffects] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      setCursorVisible(false);
      const newEffect = { x: e.clientX, y: e.clientY, id: Date.now() };
      setClickEffects(prev => [...prev, newEffect]);
      const effectTimeout = setTimeout(() => {
        setClickEffects(prev => prev.filter(r => r.id !== newEffect.id));
        setCursorVisible(true);
      }, 2000); // Effect lasts for 2 seconds
      return () => clearTimeout(effectTimeout);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {/* The main cursor follower dot */}
      <div className="cursor-follower" style={{ transform: `translate(${position.x - 6}px, ${position.y - 6}px)`, opacity: cursorVisible ? 1 : 0 }} />
      
      {/* Render ripple and water drop effects on click */}
      {clickEffects.map(effect => (
        <React.Fragment key={effect.id}>
          <div className="water-drop" style={{ left: `${effect.x}px`, top: `${effect.y}px` }} />
          <div className="ripple" style={{ left: `${effect.x}px`, top: `${effect.y}px` }} />
        </React.Fragment>
      ))}
    </>
  );
};

export default CustomCursor;
