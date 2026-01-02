import redis

# Central redis client for backend modules
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
