"""
Utility script to create or reset admin user credentials.
This can help diagnose and fix admin login issues.
"""
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.utils.security import hash_password
from datetime import datetime
import uuid

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB_NAME", "mediease")

async def create_or_reset_admin(email: str = None, password: str = None):
    """
    Create or reset admin user.
    
    Args:
        email: Admin email (if None, uses default)
        password: Admin password (if None, uses default)
    """
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Default values
    admin_email = (email or "admin@mediease.com").lower().strip()
    admin_password = password or "Admin123!"
    
    try:
        # Check if admin exists
        existing_admin = await db.users.find_one({
            "email": admin_email,
            "role": "admin"
        })
        
        if existing_admin:
            print(f"✅ Found existing admin: {admin_email}")
            print(f"   - ID: {existing_admin['_id']}")
            print(f"   - Name: {existing_admin.get('firstName', '')} {existing_admin.get('lastName', '')}")
            print(f"   - Is Active: {existing_admin.get('isActive', True)}")
            print(f"   - Has Password: {bool(existing_admin.get('password'))}")
            
            # Update password
            hashed_password = hash_password(admin_password)
            await db.users.update_one(
                {"_id": existing_admin["_id"]},
                {
                    "$set": {
                        "password": hashed_password,
                        "isActive": True,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            print(f"\n✅ Admin password reset successfully!")
            print(f"   Email: {admin_email}")
            print(f"   Password: {admin_password}")
            
        else:
            # Create new admin
            print(f"⚠️  Admin not found. Creating new admin account...")
            
            clinic_id = str(uuid.uuid4())[:8].upper()
            hashed_password = hash_password(admin_password)
            
            admin_data = {
                "firstName": "Admin",
                "lastName": "User",
                "email": admin_email,
                "password": hashed_password,
                "role": "admin",
                "phone": "+1-555-0000",
                "isActive": True,
                "clinicName": "MediEase Clinic",
                "clinicId": clinic_id,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "lastLogin": None,
            }
            
            result = await db.users.insert_one(admin_data)
            admin_id = str(result.inserted_id)
            
            print(f"✅ Admin account created successfully!")
            print(f"   - ID: {admin_id}")
            print(f"   - Email: {admin_email}")
            print(f"   - Password: {admin_password}")
            print(f"   - Clinic ID: {clinic_id}")
        
        print("\n" + "=" * 50)
        print("You can now login with:")
        print(f"  Email: {admin_email}")
        print(f"  Password: {admin_password}")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Create or reset admin user")
    parser.add_argument("--email", type=str, help="Admin email (default: admin@mediease.com)")
    parser.add_argument("--password", type=str, help="Admin password (default: Admin123!)")
    
    args = parser.parse_args()
    
    asyncio.run(create_or_reset_admin(args.email, args.password))
