import React, { useState, useCallback } from 'react';
import { X, Zap } from 'lucide-react';

const WireConnector = ({ 
  wires = [], 
  onWireCreate, 
  onWireDelete, 
  isConnecting = false,
  connectionStart = null,
  currentMousePos = null 
}) => {
  const [hoveredWire, setHoveredWire] = useState(null);

  const handleWireClick = useCallback((wireId, event) => {
    event.stopPropagation();
    if (onWireDelete) {
      onWireDelete(wireId);
    }
  }, [onWireDelete]);

  const renderWire = useCallback((wire) => {
    const { fromPos, toPos } = wire;
    
    if (!fromPos || !toPos) return null;

    // Calculate wire path
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create curved path for a more natural look
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    
    // Control points for curve
    const offset = Math.min(50, distance * 0.2);
    const controlX1 = fromPos.x + (dx > 0 ? offset : -offset);
    const controlY1 = fromPos.y;
    const controlX2 = toPos.x + (dx > 0 ? -offset : offset);
    const controlY2 = toPos.y;

    const pathData = `M ${fromPos.x} ${fromPos.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toPos.x} ${toPos.y}`;

    return (
      <g key={wire.id}>
        {/* Wire shadow/outline */}
        <path
          d={pathData}
          stroke="#000000"
          strokeWidth="4"
          fill="none"
          opacity="0.3"
        />
        {/* Main wire */}
        <path
          d={pathData}
          stroke={wire.color || '#ff0000'}
          strokeWidth="2"
          fill="none"
          className="cursor-pointer hover:stroke-opacity-80 transition-all duration-150"
          onMouseEnter={() => setHoveredWire(wire.id)}
          onMouseLeave={() => setHoveredWire(null)}
          onClick={(e) => handleWireClick(wire.id, e)}
        />
        
        {/* Wire connectors (small circles at ends) */}
        <circle
          cx={fromPos.x}
          cy={fromPos.y}
          r="3"
          fill={wire.color || '#ff0000'}
          stroke="#ffffff"
          strokeWidth="1"
        />
        <circle
          cx={toPos.x}
          cy={toPos.y}
          r="3"
          fill={wire.color || '#ff0000'}
          stroke="#ffffff"
          strokeWidth="1"
        />
        
        {/* Delete button when hovered */}
        {hoveredWire === wire.id && (
          <g transform={`translate(${midX - 8}, ${midY - 8})`}>
            <circle
              cx="8"
              cy="8"
              r="8"
              fill="#ff4444"
              stroke="#ffffff"
              strokeWidth="2"
              className="cursor-pointer"
              onClick={(e) => handleWireClick(wire.id, e)}
            />
            <X
              x="4"
              y="4"
              width="8"
              height="8"
              className="text-white pointer-events-none"
            />
          </g>
        )}
      </g>
    );
  }, [hoveredWire, handleWireClick]);

  const renderConnectionPreview = useCallback(() => {
    if (!isConnecting || !connectionStart || !currentMousePos) return null;

    const pathData = `M ${connectionStart.x} ${connectionStart.y} L ${currentMousePos.x} ${currentMousePos.y}`;
    
    return (
      <g>
        <path
          d={pathData}
          stroke="#00ff00"
          strokeWidth="2"
          strokeDasharray="5,5"
          fill="none"
          opacity="0.7"
        />
        <circle
          cx={connectionStart.x}
          cy={connectionStart.y}
          r="4"
          fill="#00ff00"
          opacity="0.7"
        />
        <circle
          cx={currentMousePos.x}
          cy={currentMousePos.y}
          r="4"
          fill="#00ff00"
          opacity="0.5"
        />
      </g>
    );
  }, [isConnecting, connectionStart, currentMousePos]);

  return (
    <g className="wire-layer">
      {/* Existing wires */}
      {wires.map(renderWire)}
      
      {/* Connection preview */}
      {renderConnectionPreview()}
    </g>
  );
};

export default WireConnector;