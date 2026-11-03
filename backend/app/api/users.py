from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.dependencies import get_current_user, require_super_admin
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import UserOut, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserOut])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    users = db.query(User).all()
    results = []
    for u in users:
        org_name = None
        if u.organization_id:
            org = db.query(Organization).filter(Organization.id == u.organization_id).first()
            if org:
                org_name = org.name
        out = UserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            avatar_url=u.avatar_url,
            organization_id=u.organization_id,
            is_active=u.is_active,
            organization_name=org_name
        )
        results.append(out)
    return results

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    hashed_pwd = get_password_hash(payload.password)
    user_dict = payload.dict(exclude={"password"})
    new_user = User(**user_dict, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    org_name = None
    if new_user.organization_id:
        org = db.query(Organization).filter(Organization.id == new_user.organization_id).first()
        if org:
            org_name = org.name

    return UserOut(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        avatar_url=new_user.avatar_url,
        organization_id=new_user.organization_id,
        is_active=new_user.is_active,
        organization_name=org_name
    )

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "super_admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this user account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_dict = payload.dict(exclude_unset=True)
    if "password" in update_dict and update_dict["password"]:
        user.hashed_password = get_password_hash(update_dict.pop("password"))
    
    for key, val in update_dict.items():
        setattr(user, key, val)

    db.commit()
    db.refresh(user)

    org_name = None
    if user.organization_id:
        org = db.query(Organization).filter(Organization.id == user.organization_id).first()
        if org:
            org_name = org.name

    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        avatar_url=user.avatar_url,
        organization_id=user.organization_id,
        is_active=user.is_active,
        organization_name=org_name
    )

