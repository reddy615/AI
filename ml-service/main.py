from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
import time

app = FastAPI(title="AI Interview ML Service", version="1.0.0")

REQUEST_COUNT = Counter("ml_requests_total", "Total ML requests", ["method", "path", "status"])
REQUEST_LATENCY = Histogram("ml_request_duration_seconds", "ML request latency")


class WeakArea(BaseModel):
    topic: str
    accuracy: int = 0
    correct: int = 0
    wrong: int = 0
    skipped: int = 0


class RecommendationRequest(BaseModel):
    userId: Optional[str] = None
    module: str = "technical"
    weakAreas: List[WeakArea] = Field(default_factory=list)
    candidateTopics: List[str] = Field(default_factory=list)


@app.get("/health")
def health():
    return {"success": True, "status": "ok"}


@app.get("/metrics")
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}


def fallback_topics(module: str) -> List[str]:
    topics_by_module = {
        "aptitude": ["percentages", "ratio", "algebra", "time and work"],
        "reasoning": ["series", "puzzles", "syllogism", "direction sense"],
        "verbal": ["grammar", "reading comprehension", "vocabulary", "sentence improvement"],
        "hr": ["conflict resolution", "leadership", "motivation", "ownership"],
        "technical": ["data structures", "system design", "debugging", "api design"],
        "coding": ["arrays", "graphs", "dynamic programming", "sorting"],
    }
    return topics_by_module.get(module, topics_by_module["technical"])


@app.post("/recommendations")
def recommendations(payload: RecommendationRequest):
    started_at = time.perf_counter()
    weak_areas = payload.weakAreas[:5]
    topics = payload.candidateTopics[:5] or [area.topic for area in weak_areas] or fallback_topics(payload.module)

    recommendations = []
    for index, topic in enumerate(topics[:5]):
        weak_area = weak_areas[index] if index < len(weak_areas) else None
        recommendations.append(
            {
                "id": f"{topic.replace(' ', '-').lower()}-{index}",
                "type": "topic" if index % 2 == 0 else "coding",
                "topic": topic,
                "title": f"Focus on {topic}",
                "priority": max(1, 100 - weak_area.accuracy) if weak_area else 50 - index * 5,
                "recommendation": (
                    f"You are at {weak_area.accuracy}% accuracy on {topic}. Review {weak_area.wrong + weak_area.skipped} questions, then run a 15-minute timed set."
                    if weak_area
                    else f"Practice {topic} next and compare the result to your last attempt."
                ),
                "practiceType": "timed-practice" if index % 2 == 0 else "coding-drill",
                "estimatedMinutes": 20 if index % 2 == 0 else 30,
            }
        )

    result = {
        "recommendations": recommendations,
        "studyPlan": [
            {"step": 1, "title": "Review weak areas", "description": "Read explanations and note recurring mistakes."},
            {"step": 2, "title": "Practice with constraints", "description": "Use timed sessions to simulate interview pressure."},
            {"step": 3, "title": "Re-run the assessment", "description": "Retest with a shorter set and compare progress."},
        ],
        "learningPath": [
            {"module": module, "label": module.upper(), "sequence": index + 1, "goal": f"Reach consistent proficiency in {module}."}
            for index, module in enumerate(["aptitude", "reasoning", "verbal", "hr", "technical", "coding"])
        ],
        "summary": {
            "weakAreasCount": len(weak_areas),
            "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            "source": "fastapi",
        },
    }

    REQUEST_COUNT.labels(method="POST", path="/recommendations", status="200").inc()
    REQUEST_LATENCY.observe(time.perf_counter() - started_at)
    return result