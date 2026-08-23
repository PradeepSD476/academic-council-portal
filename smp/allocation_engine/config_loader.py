import json
import os

def load_config(filepath="config.json"):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Configuration file not found at {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)