"""
Script to diagnose admin login issues.
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.auth_service import auth_service
from app.utils.security import verify_password

async def check_admin_login():
    """Check admin user in database and test login."""
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017')
        db = client.mediease
        
        # Find all admin users
        print("=" * 50)
        print("Checking Admin Users...")
        print("=" * 50)
        
        admins = await db.users.find({"role": "admin"}).to_list(length=None)
        
        if not admins:
            print("\n❌ No admin users found in database!")
            print("You may need to create an admin user first.")
            return
        
        print(f"\n✅ Found {len(admins)} admin user(s):\n")
        
        for i, admin in enumerate(admins, 1):
            print(f"Admin {i}:")
            print(f"  - ID: {admin.get('_id')}")
            print(f"  - Email: {admin.get('email')}")
            print(f"  - Name: {admin.get('firstName', '')} {admin.get('lastName', '')}")
            print(f"  - Is Active: {admin.get('isActive', True)}")
            print(f"  - Has Password: {bool(admin.get('password'))}")
            print(f"  - Clinic ID: {admin.get('clinicId', 'N/A')}")
            print(f"  - Last Login: {admin.get('lastLogin', 'Never')}")
            print()
        
        # Test login with each admin
        print("=" * 50)
        print("Testing Login...")
        print("=" * 50)
        
        for admin in admins:
            email = admin.get('email')
            print(f"\nTesting login for: {email}")
            
            # Check if user is active
            if not admin.get('isActive', True):
                print("  ⚠️  Account is deactivated!")
                continue
            
            # Check if password exists
            if not admin.get('password'):
                print("  ⚠️  No password set!")
                continue
            
            # Test authentication
            try:
                user = await auth_service.authenticate_user(email, "test_password")
                if user:
                    print(f"  ✅ Authentication service returned user")
                else:
                    print(f"  ❌ Authentication failed (wrong password or user not found)")
            except Exception as e:
                print(f"  ❌ Error during authentication: {str(e)}")
        
        print("\n" + "=" * 50)
        print("Recommendations:")
        print("=" * 50)
        print("1. Make sure you're using the correct email (case-insensitive)")
        print("2. Verify the password is correct")
        print("3. Check if account is active (isActive: true)")
        print("4. If password is incorrect, you may need to reset it")
        print()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_admin_login())
