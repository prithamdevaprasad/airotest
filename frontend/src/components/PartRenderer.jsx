import React, { useEffect, useRef, useState } from 'react';
import { loadSvgWithConnectors } from '../utils/parseFzp';

const PartRenderer = ({ 
  part, 
  position, 
  rotation = 0, 
  selected = false,
  onConnectorClick,
  showConnectors = false,
  scale = 1,
  onContextMenu
}) => {
  const [svgData, setSvgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (part.imagePath) {
          const data = await loadSvgWithConnectors(part.imagePath);
          setSvgData(data);
        }
      } catch (err) {
        console.error('Failed to load SVG:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSvg();
  }, [part.imagePath]);

  const handleConnectorClick = (connector, event) => {
    if (onConnectorClick) {
      event.stopPropagation();
      
      // Calculate global connector position
      const rect = svgRef.current?.getBoundingClientRect();
      const connectorPos = svgData?.connectorPositions[connector.terminalId] || 
                          svgData?.connectorPositions[connector.svgId] ||
                          { x: 0, y: 0 };
      
      const globalPos = {
        x: position.x + (connectorPos.x * scale),
        y: position.y + (connectorPos.y * scale)
      };
      
      onConnectorClick(connector, globalPos);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
          transformOrigin: 'top left'
        }}
        className="absolute"
      >
        <div className="w-16 h-16 bg-gray-200 rounded animate-pulse flex items-center justify-center">
          <div className="text-xs text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !svgData) {
    return (
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
          transformOrigin: 'top left'
        }}
        className="absolute"
      >
        <div className="w-16 h-16 bg-red-100 border border-red-300 rounded flex items-center justify-center">
          <div className="text-xs text-red-600">Error</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute cursor-move transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: 'top left'
      }}
      onContextMenu={onContextMenu}
    >
      {/* Part SVG */}
      <div
        ref={svgRef}
        className="relative"
        dangerouslySetInnerHTML={{ __html: svgData.svgContent }}
      />
      
      {/* Connectors overlay */}
      {showConnectors && svgData.connectorPositions && (
        <div className="absolute inset-0 pointer-events-none">
          {part.connectors?.map(connector => {
            const connectorPos = svgData.connectorPositions[connector.terminalId] || 
                                svgData.connectorPositions[connector.svgId];
            
            if (!connectorPos) return null;
            
            return (
              <div
                key={connector.id}
                className="absolute pointer-events-auto"
                style={{
                  left: connectorPos.x - 6,
                  top: connectorPos.y - 6,
                  width: 12,
                  height: 12
                }}
              >
                <div
                  className="w-full h-full rounded-full bg-blue-500 opacity-70 hover:opacity-100 hover:scale-125 transition-all duration-150 cursor-crosshair border-2 border-white shadow-lg"
                  title={`${connector.name} (${connector.description})`}
                  onClick={(e) => handleConnectorClick(connector, e)}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {/* Selection indicator */}
      {selected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded animate-pulse" />
          <div className="absolute -top-6 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            {part.title}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartRenderer;