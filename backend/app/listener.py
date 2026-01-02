import asyncio
from .redis_client import r
from .connection import manager

async def redis_listener():
    """Background task that watches Redis for messages from other servers"""
    pubsub = r.pubsub()
    pubsub.psubscribe("*")
    while True:
        try:
            msg = pubsub.get_message(ignore_subscribe_messages=True)
            if msg and msg['type'] == 'pmessage':
                room_id = msg['channel']
                if isinstance(msg['data'], bytes):
                    content = msg['data'].decode('utf-8')
                else:
                    content = msg['data']
                if room_id in manager.active_connections:
                    await manager.broadcast_local(content, room_id)
            await asyncio.sleep(0.01)
        except Exception as e:
            print(f"Redis Error: {e}")
            await asyncio.sleep(1)
