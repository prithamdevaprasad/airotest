from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorCollection
from models.project import Project, ProjectCreate, ProjectUpdate

class ProjectService:
    def __init__(self, db_collection: AsyncIOMotorCollection):
        self.collection = db_collection

    async def get_all_projects(self, skip: int = 0, limit: int = 100) -> List[Project]:
        """Get all projects"""
        cursor = self.collection.find({}).skip(skip).limit(limit).sort("updated_at", -1)
        projects = await cursor.to_list(length=limit)
        return [Project(**project) for project in projects]

    async def get_project_by_id(self, project_id: str) -> Optional[Project]:
        """Get a specific project by ID"""
        project = await self.collection.find_one({"id": project_id})
        if project:
            return Project(**project)
        return None

    async def create_project(self, project_data: ProjectCreate) -> Project:
        """Create a new project"""
        project = Project(**project_data.dict())
        await self.collection.insert_one(project.dict())
        return project

    async def update_project(self, project_id: str, project_data: ProjectUpdate) -> Optional[Project]:
        """Update an existing project"""
        update_data = {k: v for k, v in project_data.dict().items() if v is not None}
        if not update_data:
            return await self.get_project_by_id(project_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.collection.update_one(
            {"id": project_id},
            {"$set": update_data}
        )
        
        if result.modified_count:
            return await self.get_project_by_id(project_id)
        return None

    async def delete_project(self, project_id: str) -> bool:
        """Delete a project"""
        result = await self.collection.delete_one({"id": project_id})
        return result.deleted_count > 0

    async def duplicate_project(self, project_id: str, new_name: Optional[str] = None) -> Optional[Project]:
        """Duplicate an existing project"""
        original = await self.get_project_by_id(project_id)
        if not original:
            return None
        
        # Create new project with duplicated data
        project_data = ProjectCreate(
            name=new_name or f"{original.name} (Copy)",
            description=original.description,
            parts=original.parts,
            wires=original.wires,
            canvas_settings=original.canvas_settings
        )
        
        return await self.create_project(project_data)