"""
api.py
------
REST API exposing the property recommendation "brain" to the React
frontend. Run with:

    uvicorn api:app --reload --port 8000

Interactive docs (great for your demo / marks on "system functionality"):
    http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from models import load_properties, get_known_estates
from nlp_parser import parse_query
from fuzzy_engine import recommend
from dialogue import get_or_create_session, handle_message

app = FastAPI(
    title="Nairobi Property Recommendation API",
    description="Fuzzy-logic + NLP powered property recommendation engine, "
                 "with a conversational /chat endpoint that keeps context across turns.",
    version="1.1.0",
)

# Allow the React dev server (and any origin during development) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PROPERTIES = load_properties("properties.json")
KNOWN_ESTATES = get_known_estates(PROPERTIES)


class RecommendRequest(BaseModel):
    query: str = Field(..., description="Natural language query, e.g. "
                        "'2 bedroom apartment in Kilimani under 150k with good security'")
    top_n: int = Field(5, ge=1, le=20)


class CriterionBreakdown(BaseModel):
    criterion: str
    membership: float
    weight: float


class RecommendationItem(BaseModel):
    property_id: str
    name: str
    estate: str
    sub_location: str
    listing_type: str
    property_type: str
    price_kes: float
    bedrooms: int
    security_rating: str
    distance_cbd_km: float
    score: float
    explanation: list[str]
    breakdown: list[CriterionBreakdown]
    google_maps_link: str | None = None
    image_url: str | None = None


class RecommendResponse(BaseModel):
    query: str
    parsed_intent: dict
    notes: list[str]
    results: list[RecommendationItem]


class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's chat message (typed or voice-transcribed)")
    session_id: str | None = Field(None, description="Pass the session_id from the previous "
                                    "response to continue the same conversation; omit to start a new one")


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    parsed_intent: dict
    results: list[RecommendationItem]


def _match_result_to_item(m) -> RecommendationItem:
    return RecommendationItem(
        property_id=m.property.id,
        name=m.property.name,
        estate=m.property.estate,
        sub_location=m.property.sub_location,
        listing_type=m.property.listing_type,
        property_type=m.property.property_type,
        price_kes=m.property.price_kes,
        bedrooms=m.property.bedrooms,
        security_rating=m.property.security_rating,
        distance_cbd_km=m.property.distance_cbd_km,
        score=m.score,
        explanation=m.explanation,
        breakdown=[
            CriterionBreakdown(criterion=k, membership=round(v[0], 3), weight=v[1])
            for k, v in m.breakdown.items()
        ],
        google_maps_link=m.property.raw.get("Google_Maps_Link"),
        image_url=m.property.image_url,
    )


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """Conversational endpoint with memory: pass the returned session_id back
    on each subsequent call to keep context (budget, area, etc.) across turns."""
    session = get_or_create_session(req.session_id)
    outcome = handle_message(session, req.message, PROPERTIES, KNOWN_ESTATES)
    return ChatResponse(
        reply=outcome["reply"],
        session_id=outcome["session_id"],
        parsed_intent=outcome["parsed_intent"],
        results=[_match_result_to_item(m) for m in outcome["results"]],
    )


@app.get("/health")
def health():
    return {"status": "ok", "properties_loaded": len(PROPERTIES)}


@app.get("/estates")
def estates():
    return {"estates": KNOWN_ESTATES}


@app.get("/properties")
def list_properties(listing_type: str | None = None, estate: str | None = None):
    results = PROPERTIES
    if listing_type:
        results = [p for p in results if p.listing_type.lower() == listing_type.lower()]
    if estate:
        results = [p for p in results if p.estate.lower() == estate.lower()]
    return {"count": len(results), "properties": [p.raw for p in results]}


@app.get("/properties/{property_id}")
def get_property(property_id: str):
    for p in PROPERTIES:
        if p.id == property_id:
            return p.raw
    raise HTTPException(status_code=404, detail="Property not found")


@app.post("/recommend", response_model=RecommendResponse)
def recommend_properties(req: RecommendRequest):
    intent = parse_query(req.query, KNOWN_ESTATES)
    matches = recommend(PROPERTIES, intent, top_n=req.top_n)

    return RecommendResponse(
        query=req.query,
        parsed_intent={k: v for k, v in vars(intent).items() if k != "raw_text"},
        notes=intent.unmatched_notes,
        results=[_match_result_to_item(m) for m in matches],
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)