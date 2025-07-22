import os
import xml.etree.ElementTree as ET
from typing import List, Optional, Dict, Any
from pathlib import Path
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorCollection
from models.part import FritzingPart, PartCreate, PartUpdate, Connector

class PartService:
    def __init__(self, db_collection: AsyncIOMotorCollection):
        self.collection = db_collection
        self.fritzing_parts_path = Path("/app/public/parts")

    async def get_all_parts(self, skip: int = 0, limit: int = 100, search: Optional[str] = None, family: Optional[str] = None) -> List[FritzingPart]:
        """Get all parts with optional filtering"""
        query = {}
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}}
            ]
        
        if family and family != "all":
            query["properties.family"] = {"$regex": family, "$options": "i"}
        
        cursor = self.collection.find(query).skip(skip).limit(limit)
        parts = await cursor.to_list(length=limit)
        
        return [FritzingPart(**part) for part in parts]

    async def get_part_by_id(self, part_id: str) -> Optional[FritzingPart]:
        """Get a specific part by ID"""
        part = await self.collection.find_one({"id": part_id})
        if part:
            return FritzingPart(**part)
        return None

    async def create_part(self, part_data: PartCreate) -> FritzingPart:
        """Create a new part"""
        part = FritzingPart(**part_data.dict())
        await self.collection.insert_one(part.dict())
        return part

    async def update_part(self, part_id: str, part_data: PartUpdate) -> Optional[FritzingPart]:
        """Update an existing part"""
        update_data = {k: v for k, v in part_data.dict().items() if v is not None}
        if not update_data:
            return await self.get_part_by_id(part_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.collection.update_one(
            {"id": part_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            return await self.get_part_by_id(part_id)
        return None

    async def delete_part(self, part_id: str) -> bool:
        """Delete a part"""
        result = await self.collection.delete_one({"id": part_id})
        return result.deleted_count > 0

    def parse_fzp_file(self, fzp_path: str) -> Optional[Dict[str, Any]]:
        """Parse a .fzp file and extract component information"""
        try:
            if not os.path.exists(fzp_path):
                return None
                
            tree = ET.parse(fzp_path)
            root = tree.getroot()
            
            if root.tag != 'module':
                return None
            
            # Extract basic information
            title = root.find('title')
            title_text = title.text if title is not None else ''
            
            description = root.find('description')
            description_text = description.text if description is not None else ''
            
            author = root.find('author')
            author_text = author.text if author is not None else ''
            
            # Extract properties
            properties = {}
            properties_elem = root.find('properties')
            if properties_elem is not None:
                for prop in properties_elem.findall('property'):
                    name = prop.get('name')
                    value = prop.text
                    if name and value:
                        properties[name] = value
            
            # Extract tags
            tags = []
            tags_elem = root.find('tags')
            if tags_elem is not None:
                for tag in tags_elem.findall('tag'):
                    if tag.text:
                        tags.append(tag.text)
            
            # Extract image path for breadboard view
            image_path = ""
            breadboard_view = root.find('.//breadboardView')
            if breadboard_view is not None:
                layers = breadboard_view.find('layers')
                if layers is not None:
                    image_attr = layers.get('image')
                    if image_attr:
                        image_path = f"/parts/svg/core/{image_attr}"
            
            # Extract connectors
            connectors = []
            for connector_elem in root.findall('.//connector'):
                connector_id = connector_elem.get('id', '')
                connector_name = connector_elem.get('name', '')
                connector_type = connector_elem.get('type', '')
                
                desc_elem = connector_elem.find('description')
                connector_desc = desc_elem.text if desc_elem is not None else ''
                
                # Get breadboard view info
                breadboard_p = connector_elem.find('.//breadboardView/p')
                svg_id = breadboard_p.get('svgId', '') if breadboard_p is not None else ''
                terminal_id = breadboard_p.get('terminalId', '') if breadboard_p is not None else ''
                
                connectors.append(Connector(
                    id=connector_id,
                    name=connector_name,
                    type=connector_type,
                    description=connector_desc,
                    svg_id=svg_id,
                    terminal_id=terminal_id
                ))
            
            return {
                "module_id": root.get('moduleId', ''),
                "title": title_text,
                "description": description_text,
                "author": author_text,
                "properties": properties,
                "tags": tags,
                "image_path": image_path,
                "connectors": [connector.dict() for connector in connectors]
            }
            
        except Exception as e:
            print(f"Error parsing FZP file {fzp_path}: {str(e)}")
            return None

    async def load_fritzing_parts(self, force_reload: bool = False) -> int:
        """Load parts from the fritzing-parts repository"""
        if not force_reload:
            # Check if parts already exist
            count = await self.collection.count_documents({})
            if count > 0:
                return count
        
        parts_loaded = 0
        core_path = self.fritzing_parts_path / "core"
        
        if not core_path.exists():
            return 0
        
        # Process .fzp files
        for fzp_file in core_path.glob("*.fzp"):
            try:
                part_data = self.parse_fzp_file(str(fzp_file))
                if part_data:
                    # Check if part already exists
                    existing = await self.collection.find_one({"module_id": part_data["module_id"]})
                    if not existing or force_reload:
                        part = FritzingPart(**part_data)
                        if existing and force_reload:
                            await self.collection.replace_one({"id": existing["id"]}, part.dict())
                        else:
                            await self.collection.insert_one(part.dict())
                        parts_loaded += 1
                        
                        if parts_loaded % 100 == 0:
                            print(f"Loaded {parts_loaded} parts...")
                            
            except Exception as e:
                print(f"Error processing {fzp_file}: {str(e)}")
                continue
        
        return parts_loaded

    async def get_part_families(self) -> List[str]:
        """Get all unique part families"""
        pipeline = [
            {"$group": {"_id": "$properties.family"}},
            {"$match": {"_id": {"$ne": None}}},
            {"$sort": {"_id": 1}}
        ]
        
        cursor = self.collection.aggregate(pipeline)
        families = await cursor.to_list(length=None)
        
        return [family["_id"] for family in families if family["_id"]]