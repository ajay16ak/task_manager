from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from tinydb import TinyDB, Query
from .. import schemas
from ..database import get_db
from ..auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)

@router.post("/", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task(task: schemas.TaskCreate, db: TinyDB = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    tasks_table = db.table('tasks')
    
    task_data = task.model_dump()
    task_data["user_id"] = current_user.id
    task_data["created_at"] = datetime.now(timezone.utc).isoformat()
    if task_data.get("due_date"):
        task_data["due_date"] = task_data["due_date"].isoformat()
        
    doc_id = tasks_table.insert(task_data)
    task_data["id"] = doc_id
    
    return schemas.Task(**task_data)

@router.get("/", response_model=List[schemas.Task])
def read_tasks(
    skip: int = 0, 
    limit: int = 100, 
    sort_by: str = "created_at", 
    order: str = "desc",
    db: TinyDB = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    tasks_table = db.table('tasks')
    TaskQ = Query()
    
    user_tasks = tasks_table.search(TaskQ.user_id == current_user.id)
    
    # Sort
    def sort_key(t):
        val = t.get(sort_by)
        # Handle None values for sorting
        if val is None:
            return ""
        return val
        
    user_tasks.sort(key=sort_key, reverse=(order.lower() == "desc"))
    
    # Pagination
    paginated_tasks = user_tasks[skip : skip + limit]
    
    # Map IDs
    result = []
    for t in paginated_tasks:
        t["id"] = t.doc_id
        result.append(schemas.Task(**t))
        
    return result

@router.get("/{task_id}", response_model=schemas.Task)
def read_task(task_id: int, db: TinyDB = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    tasks_table = db.table('tasks')
    task = tasks_table.get(doc_id=task_id)
    
    if task is None or task.get("user_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task["id"] = task.doc_id
    return schemas.Task(**task)

@router.put("/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: TinyDB = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    tasks_table = db.table('tasks')
    task = tasks_table.get(doc_id=task_id)
    
    if task is None or task.get("user_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_update.model_dump(exclude_unset=True)
    if "due_date" in update_data and update_data["due_date"]:
        update_data["due_date"] = update_data["due_date"].isoformat()
        
    tasks_table.update(update_data, doc_ids=[task_id])
    
    updated_task = tasks_table.get(doc_id=task_id)
    updated_task["id"] = updated_task.doc_id
    return schemas.Task(**updated_task)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: TinyDB = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    tasks_table = db.table('tasks')
    task = tasks_table.get(doc_id=task_id)
    
    if task is None or task.get("user_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")

    tasks_table.remove(doc_ids=[task_id])
    return None