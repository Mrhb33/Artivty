import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    try:
        print("Testing MongoDB connection...")
        client = AsyncIOMotorClient("mongodb+srv://artivty:DCEK4c069OOhcxA1@cluster0.96ktsr4.mongodb.net/?appName=Cluster0", serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✅ MongoDB connected successfully!")
        await client.close()
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
