from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid

class Connector(BaseModel):
    id: str
    name: str
    type: str
    description: Optional[str] = ""
    svg_id: Optional[str] = ""
    terminal_id: Optional[str] = ""

class FritzingPart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    module_id: Optional[str] = ""
    title: str
    description: Optional[str] = ""
    author: Optional[str] = ""
    properties: Dict[str, str] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    image_path: Optional[str] = ""
    connectors: List[Connector] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PartCreate(BaseModel):
    module_id: Optional[str] = ""
    title: str
    description: Optional[str] = ""
    author: Optional[str] = ""
    properties: Dict[str, str] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    image_path: Optional[str] = ""
    connectors: List[Connector] = Field(default_factory=list)

class PartUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    author: Optional[str] = None
    properties: Optional[Dict[str, str]] = None
    tags: Optional[List[str]] = None
    image_path: Optional[str] = None
    connectors: Optional[List[Connector]] = None