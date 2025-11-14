#!/usr/bin/env python3
"""
Script to delete all appointments from MongoDB for all doctors and clinics.
Use with caution - this will permanently delete all appointment data.
"""

import asyncio
import logging
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.database import Database

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def delete_all_appointments():
    """
    Delete all appointments from the database.
    """
    try:
        # Connect to database
        logger.info("Connecting to MongoDB...")
        await Database.connect_db()
        db = Database.get_database()

        # Get count before deletion
        collection = db.appointments
        count_before = await collection.count_documents({})
        logger.info(f"Found {count_before} appointments in the database")

        if count_before == 0:
            logger.info("No appointments to delete")
            return

        # Confirm deletion (in a real scenario, you'd want user confirmation)
        logger.warning("⚠️  DELETING ALL APPOINTMENTS ⚠️")
        logger.warning("This action cannot be undone!")

        # Delete all appointments
        result = await collection.delete_many({})

        # Get count after deletion
        count_after = await collection.count_documents({})

        logger.info(f"Successfully deleted {result.deleted_count} appointments")
        logger.info(f"Remaining appointments: {count_after}")

        # Close database connection
        await Database.close_db()

    except Exception as e:
        logger.error(f"Error deleting appointments: {e}")
        raise


async def main():
    """
    Main function to run the script.
    """
    logger.info("Starting appointment deletion script...")

    # Double confirmation
    print("\n" + "="*60)
    print("⚠️  APPOINTMENT DELETION SCRIPT ⚠️")
    print("="*60)
    print("This will DELETE ALL appointments from MongoDB!")
    print("This action is IRREVERSIBLE!")
    print()
    print("Affected collections:")
    print("- appointments (all records)")
    print()
    print("This will affect:")
    print("- All doctors across all clinics")
    print("- All appointment statuses (scheduled, completed, cancelled, etc.)")
    print("- All patient appointment history")
    print()

    # In a production environment, you'd want actual user confirmation
    # For this demo, we'll proceed automatically but log the warning
    logger.warning("Proceeding with deletion...")

    await delete_all_appointments()

    logger.info("Appointment deletion completed successfully!")


if __name__ == "__main__":
    # Run the script
    asyncio.run(main())
