# test_app.py
from fastapi import FastAPI
from typing import Any, List, Optional
from pydantic import BaseModel

app = FastAPI()


class Item(BaseModel):
    name: str
    description: Optional[str] = None
    tags: List[str] = []


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items")
def read_items() -> List[Item]:
    return [Item(name="Item 1", tags=["tag1"])]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("test_app:app", host="0.0.0.0", port=8000)
