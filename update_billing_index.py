#!/usr/bin/env python3
"""
Update billing items index to make clinicId + key unique (instead of clinicId + category + key).
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="fastapi/.env")

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URL", "mongodb://localhost:27017/mediease")
DB_NAME = os.getenv("DATABASE_NAME", "mediease")


async def update_billing_index():
    """Update the billing items unique index."""
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    try:
        collection = db.billing_items

        # Drop the old compound index if it exists
        try:
            await collection.drop_index("clinicId_1_category_1_key_1")
            print("✅ Dropped old unique index: clinicId_1_category_1_key_1")
        except Exception as e:
            print(f"ℹ️  Old index not found or already dropped: {e}")

        # Create the new unique index on clinicId + key
        await collection.create_index([("clinicId", 1), ("key", 1)], unique=True)
        print("✅ Created new unique index: clinicId_1_key_1")

        print("\n📋 Index update completed successfully!")
        print("   Now the combination of clinicId + key is unique.")
        print("   Same key can exist across different clinics.")
        print("   Same key cannot exist within the same clinic (regardless of category).")

    except Exception as e:
        print(f"❌ Error updating billing index: {e}")
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    print("🔄 Updating billing items index...")
    asyncio.run(update_billing_index())
