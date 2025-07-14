# main.py (FastAPI backend)
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from final_recommender import RecommendationSession
from data_prep import load_candidate_csv, group_by_original
import chromadb

app = FastAPI()

# Allow frontend to access this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

grouped = group_by_original(load_candidate_csv("../src/data/replacements.csv"))
chroma = chromadb.PersistentClient("chroma/usa_products")
session_store = {}

class RecommendationResponse(BaseModel):
    replacement_id: str
    name: str
    brand: str
    category: str
    price: float
    reason_code: str
    brand_popularity: float

@app.get("/recommend", response_model=RecommendationResponse)
def recommend(original_id: str, rejected_id: str = Query(None)):
    if original_id not in session_store:
        session_store[original_id] = RecommendationSession(original_id, grouped, chroma)
    
    session = session_store[original_id]

    if rejected_id:
        session.reject(rejected_id)

    rec = session._llm_backfill()
    return rec
