from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid

class Position(BaseModel):
    x: float
    y: float

class PartInstance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    part_id: str  # Reference to FritzingPart
    position: Position
    rotation: float = 0.0
    properties: Dict[str, Any] = Field(default_factory=dict)

class Wire(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_part_id: str
    from_connector: str
    to_part_id: str
    to_connector: str
    color: str = "#ff0000"
    from_pos: Optional[Position] = None
    to_pos: Optional[Position] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    parts: List[PartInstance] = Field(default_factory=list)
    wires: List[Wire] = Field(default_factory=list)
    canvas_settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    parts: List[PartInstance] = Field(default_factory=list)
    wires: List[Wire] = Field(default_factory=list)
    canvas_settings: Dict[str, Any] = Field(default_factory=dict)

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parts: Optional[List[PartInstance]] = None
    wires: Optional[List[Wire]] = None
    canvas_settings: Optional[Dict[str, Any]] = None