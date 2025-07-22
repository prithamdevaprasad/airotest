import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Trash2, Save, Grid, Move, Zap, Square } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import PartRenderer from './PartRenderer';
import WireConnector from './WireConnector';
import { saveProject } from '../utils/mockData';

const GRID_SIZE = 20;
const SNAP_THRESHOLD = 10;

const CanvasEditor = ({ project, onProjectUpdate, className }) => {
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedParts, setSelectedParts] = useState(new Set());
  const [dragState, setDragState] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [mode, setMode] = useState('select'); // 'select', 'move', 'wire'
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Wire connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  
  const [parts, setParts] = useState(project?.parts || []);
  const [wires, setWires] = useState(project?.wires || []);

  // Update parent when project changes
  useEffect(() => {
    if (onProjectUpdate) {
      onProjectUpdate({
        ...project,
        parts,
        wires
      });
    }
  }, [parts, wires, project, onProjectUpdate]);

  // Handle mouse events
  const handleMouseMove = useCallback((event) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;
    setMousePos({ x, y });

    // Handle dragging
    if (dragState) {
      const dx = x - dragState.startPos.x;
      const dy = y - dragState.startPos.y;

      if (dragState.type === 'part') {
        setParts(prev => prev.map(part => {
          if (selectedParts.has(part.id)) {
            const newX = dragState.initialPositions[part.id].x + dx;
            const newY = dragState.initialPositions[part.id].y + dy;
            
            // Snap to grid if enabled
            const snappedX = showGrid ? Math.round(newX / GRID_SIZE) * GRID_SIZE : newX;
            const snappedY = showGrid ? Math.round(newY / GRID_SIZE) * GRID_SIZE : newY;
            
            return {
              ...part,
              position: { x: snappedX, y: snappedY }
            };
          }
          return part;
        }));
      } else if (dragState.type === 'canvas') {
        setPan({
          x: dragState.initialPan.x + (event.clientX - dragState.startMousePos.x),
          y: dragState.initialPan.y + (event.clientY - dragState.startMousePos.y)
        });
      }
    }
  }, [dragState, selectedParts, pan, zoom, showGrid]);

  const handleMouseDown = useCallback((event) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;

    if (mode === 'move' || (event.button === 1)) {
      // Pan mode or middle mouse button
      setDragState({
        type: 'canvas',
        startMousePos: { x: event.clientX, y: event.clientY },
        initialPan: { ...pan }
      });
    } else if (selectedParts.size > 0) {
      // Start dragging selected parts
      const initialPositions = {};
      parts.forEach(part => {
        if (selectedParts.has(part.id)) {
          initialPositions[part.id] = { ...part.position };
        }
      });

      setDragState({
        type: 'part',
        startPos: { x, y },
        initialPositions
      });
    }
  }, [mode, pan, zoom, selectedParts, parts]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // Handle part selection
  const handlePartClick = useCallback((partId, event) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedParts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(partId)) {
          newSet.delete(partId);
        } else {
          newSet.add(partId);
        }
        return newSet;
      });
    } else {
      // Single select
      setSelectedParts(new Set([partId]));
    }
  }, []);

  // Handle canvas click
  const handleCanvasClick = useCallback((event) => {
    if (event.target === canvasRef.current && !dragState) {
      setSelectedParts(new Set());
      setIsConnecting(false);
      setConnectionStart(null);
    }
  }, [dragState]);

  // Handle drop from parts library
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;

    try {
      const partData = JSON.parse(event.dataTransfer.getData('application/json'));
      const newPart = {
        id: `part-${Date.now()}`,
        partId: partData.id,
        position: { 
          x: showGrid ? Math.round(x / GRID_SIZE) * GRID_SIZE : x, 
          y: showGrid ? Math.round(y / GRID_SIZE) * GRID_SIZE : y 
        },
        rotation: 0,
        ...partData
      };
      
      setParts(prev => [...prev, newPart]);
      setSelectedParts(new Set([newPart.id]));
      
      toast({
        title: "Part Added",
        description: `${partData.title} added to canvas`
      });
    } catch (error) {
      console.error('Error adding part:', error);
      toast({
        title: "Error",
        description: "Failed to add part to canvas",
        variant: "destructive"
      });
    }
  }, [pan, zoom, showGrid, toast]);

  // Handle connector clicks for wire creation
  const handleConnectorClick = useCallback((part, connector, globalPos) => {
    if (mode !== 'wire') return;

    if (!isConnecting) {
      // Start connection
      setIsConnecting(true);
      setConnectionStart({
        partId: part.id,
        connectorId: connector.id,
        x: globalPos.x,
        y: globalPos.y
      });
    } else if (connectionStart) {
      // Complete connection
      if (connectionStart.partId !== part.id) {
        const newWire = {
          id: `wire-${Date.now()}`,
          fromPartId: connectionStart.partId,
          fromConnector: connectionStart.connectorId,
          toPartId: part.id,
          toConnector: connector.id,
          color: '#ff0000',
          fromPos: { x: connectionStart.x, y: connectionStart.y },
          toPos: { x: globalPos.x, y: globalPos.y }
        };
        
        setWires(prev => [...prev, newWire]);
        toast({
          title: "Wire Connected",
          description: "Parts connected successfully"
        });
      }
      
      setIsConnecting(false);
      setConnectionStart(null);
    }
  }, [mode, isConnecting, connectionStart, toast]);

  // Toolbar actions
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleRotateSelected = () => {
    setParts(prev => prev.map(part => 
      selectedParts.has(part.id) 
        ? { ...part, rotation: (part.rotation + 90) % 360 }
        : part
    ));
  };

  const handleDeleteSelected = () => {
    if (selectedParts.size > 0) {
      setParts(prev => prev.filter(part => !selectedParts.has(part.id)));
      setWires(prev => prev.filter(wire => 
        !selectedParts.has(wire.fromPartId) && !selectedParts.has(wire.toPartId)
      ));
      setSelectedParts(new Set());
      toast({
        title: "Parts Deleted",
        description: `${selectedParts.size} part(s) removed`
      });
    }
  };

  const handleSave = () => {
    if (project) {
      saveProject({
        ...project,
        parts,
        wires
      });
      toast({
        title: "Project Saved",
        description: "Your circuit has been saved successfully"
      });
    }
  };

  // Generate grid pattern
  const gridPattern = showGrid ? (
    <defs>
      <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
        <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e0e0e0" strokeWidth="1"/>
      </pattern>
    </defs>
  ) : null;

  return (
    <div className={`flex flex-col bg-gray-50 ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-white px-4 py-2 flex items-center gap-2 flex-wrap">
        {/* Mode selection */}
        <div className="flex gap-1 mr-4">
          <Button
            variant={mode === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('select')}
          >
            <Square size={16} className="mr-1" />
            Select
          </Button>
          <Button
            variant={mode === 'move' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('move')}
          >
            <Move size={16} className="mr-1" />
            Pan
          </Button>
          <Button
            variant={mode === 'wire' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('wire')}
          >
            <Zap size={16} className="mr-1" />
            Wire
          </Button>
        </div>

        {/* Zoom controls */}
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut size={16} />
        </Button>
        <Badge variant="outline">{Math.round(zoom * 100)}%</Badge>
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn size={16} />
        </Button>

        <div className="border-l mx-2 h-6" />

        {/* Tools */}
        <Button variant="outline" size="sm" onClick={handleRotateSelected} disabled={selectedParts.size === 0}>
          <RotateCw size={16} className="mr-1" />
          Rotate
        </Button>
        <Button variant="outline" size="sm" onClick={handleDeleteSelected} disabled={selectedParts.size === 0}>
          <Trash2 size={16} className="mr-1" />
          Delete
        </Button>
        
        <div className="border-l mx-2 h-6" />
        
        <Button
          variant={showGrid ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
        >
          <Grid size={16} className="mr-1" />
          Grid
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save size={16} className="mr-1" />
          Save
        </Button>

        {selectedParts.size > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {selectedParts.size} selected
          </Badge>
        )}
        
        {isConnecting && (
          <Badge variant="default" className="ml-2 bg-green-500">
            Connecting... Click target connector
          </Badge>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{ cursor: mode === 'move' ? 'grab' : 'default' }}
        >
          <svg
            width="100%"
            height="100%"
            className="block"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            {gridPattern}
            {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}
            
            {/* Wires layer */}
            <WireConnector
              wires={wires}
              onWireDelete={(wireId) => setWires(prev => prev.filter(w => w.id !== wireId))}
              isConnecting={isConnecting}
              connectionStart={connectionStart}
              currentMousePos={mousePos}
            />
          </svg>

          {/* Parts layer */}
          {parts.map(part => (
            <div
              key={part.id}
              onClick={(e) => handlePartClick(part.id, e)}
            >
              <PartRenderer
                part={part}
                position={part.position}
                rotation={part.rotation}
                selected={selectedParts.has(part.id)}
                showConnectors={mode === 'wire'}
                scale={zoom}
                onConnectorClick={(connector, globalPos) => handleConnectorClick(part, connector, globalPos)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;