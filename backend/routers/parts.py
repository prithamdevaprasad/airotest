from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from services.part_service import PartService
from models.part import FritzingPart, PartCreate, PartUpdate
from database import get_database

router = APIRouter(prefix="/parts", tags=["parts"])

def get_part_service():
    db = get_database()
    return PartService(db.fritzing_parts)

@router.get("/", response_model=List[FritzingPart])
async def get_parts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    family: Optional[str] = Query(None),
    service: PartService = Depends(get_part_service)
):
    """Get all parts with optional filtering"""
    return await service.get_all_parts(skip=skip, limit=limit, search=search, family=family)

@router.get("/families", response_model=List[str])
async def get_part_families(service: PartService = Depends(get_part_service)):
    """Get all unique part families"""
    return await service.get_part_families()

@router.get("/{part_id}", response_model=FritzingPart)
async def get_part(part_id: str, service: PartService = Depends(get_part_service)):
    """Get a specific part by ID"""
    part = await service.get_part_by_id(part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part

@router.post("/", response_model=FritzingPart)
async def create_part(part_data: PartCreate, service: PartService = Depends(get_part_service)):
    """Create a new part"""
    return await service.create_part(part_data)

@router.put("/{part_id}", response_model=FritzingPart)
async def update_part(
    part_id: str, 
    part_data: PartUpdate, 
    service: PartService = Depends(get_part_service)
):
    """Update an existing part"""
    part = await service.update_part(part_id, part_data)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part

@router.delete("/{part_id}")
async def delete_part(part_id: str, service: PartService = Depends(get_part_service)):
    """Delete a part"""
    success = await service.delete_part(part_id)
    if not success:
        raise HTTPException(status_code=404, detail="Part not found")
    return {"message": "Part deleted successfully"}

@router.post("/load-fritzing-parts")
async def load_fritzing_parts(
    force_reload: bool = Query(False),
    service: PartService = Depends(get_part_service)
):
    """Load parts from the fritzing-parts repository"""
    parts_loaded = await service.load_fritzing_parts(force_reload=force_reload)
    return {
        "message": f"Successfully loaded {parts_loaded} parts",
        "parts_loaded": parts_loaded
    }