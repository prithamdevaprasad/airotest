from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from services.project_service import ProjectService
from models.project import Project, ProjectCreate, ProjectUpdate
from database import get_database

router = APIRouter(prefix="/projects", tags=["projects"])

def get_project_service():
    db = get_database()
    return ProjectService(db.projects)

@router.get("/", response_model=List[Project])
async def get_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service: ProjectService = Depends(get_project_service)
):
    """Get all projects"""
    return await service.get_all_projects(skip=skip, limit=limit)

@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, service: ProjectService = Depends(get_project_service)):
    """Get a specific project by ID"""
    project = await service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/", response_model=Project)
async def create_project(project_data: ProjectCreate, service: ProjectService = Depends(get_project_service)):
    """Create a new project"""
    return await service.create_project(project_data)

@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str, 
    project_data: ProjectUpdate, 
    service: ProjectService = Depends(get_project_service)
):
    """Update an existing project"""
    project = await service.update_project(project_id, project_data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}")
async def delete_project(project_id: str, service: ProjectService = Depends(get_project_service)):
    """Delete a project"""
    success = await service.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

@router.post("/{project_id}/duplicate", response_model=Project)
async def duplicate_project(
    project_id: str,
    new_name: Optional[str] = Query(None),
    service: ProjectService = Depends(get_project_service)
):
    """Duplicate an existing project"""
    project = await service.duplicate_project(project_id, new_name)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project