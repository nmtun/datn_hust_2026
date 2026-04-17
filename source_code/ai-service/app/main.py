import os

from fastapi import FastAPI
from db import test_connection

app = FastAPI()


@app.on_event("startup")
def startup_event():
    test_connection()


@app.get("/")
def read_root():
    return {"message": "API is running"}