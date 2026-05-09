import os
from tinydb import TinyDB

# Store the DB file in the backend directory
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tinydb_app.json")

# Initialize the TinyDB instance
db_instance = TinyDB(DB_PATH)

def get_db():
    yield db_instance