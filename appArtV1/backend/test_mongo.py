import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongo_connection():
    try:
        # Test MongoDB Atlas connection
        client = AsyncIOMotorClient("mongodb+srv://artivty:DCEK4c069OOhcxA1@cluster0.96ktsr4.mongodb.net/?appName=Cluster0")

        # Ping the database
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")

        # List databases
        databases = await client.list_database_names()
        print(f"Available databases: {databases}")

        # Test specific database
        db = client["appartv1"]
        collections = await db.list_collection_names()
        print(f"Collections in 'appartv1' database: {collections}")

        await client.close()

    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_mongo_connection())
