#!/usr/bin/env python3
"""
Script to delete all consultation history (recordings) from MongoDB.
Use with extreme caution – this permanently removes all consultation records.
"""

import asyncio
import logging
import os
import sys

# Ensure we can import the FastAPI app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def delete_all_recordings():
    """Delete every document from the recordings collection."""
    try:
        logger.info("Connecting to MongoDB…")
        await Database.connect_db()
        db = Database.get_database()

        recordings_collection = db.recordings
        count_before = await recordings_collection.count_documents({})
        logger.info("Found %s consultation history entries", count_before)

        if count_before == 0:
            logger.info("No consultation history to delete.")
            return

        logger.warning("⚠️  DELETING ALL CONSULTATION HISTORY ⚠️")
        logger.warning("This action cannot be undone!")

        result = await recordings_collection.delete_many({})
        logger.info("Deleted %s consultation history entries", result.deleted_count)

        count_after = await recordings_collection.count_documents({})
        logger.info("Remaining consultation history entries: %s", count_after)
    finally:
        logger.info("Closing MongoDB connection…")
        await Database.close_db()
        logger.info("MongoDB connection closed.")


async def main():
    logger.info("Starting consultation history purge script…")
    await delete_all_recordings()
    logger.info("Consultation history purge completed.")


if __name__ == "__main__":
    asyncio.run(main())
