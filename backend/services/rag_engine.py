"""
services/rag_engine.py

CHECKPOINT: Dual RAG Engine — Retrieval Augmented Generation (Production Level)

Smart date-aware retrieval:
- Minor/acute illness records: relevant only within the past 30 days
- Chronic/severe conditions (diabetes, hypertension, heart disease, cancer, etc.):
  always included if semantically relevant regardless of age
- Cosine similarity threshold: 0.60 for chronic, 0.65 for acute
"""

import json
import math
import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.models import HealthRecord, VectorEmbedding
from services.llm_service import get_embedding

# ─── Chronic Condition Keywords ──────────────────────────────────────────────
# Records containing these keywords are treated as "always relevant" regardless of age
CHRONIC_KEYWORDS = [
    "diabetes", "diabetic", "hypertension", "hypertensive", "bp", "blood pressure",
    "heart disease", "cardiac", "coronary", "arrhythmia", "atrial fibrillation",
    "thyroid", "hypothyroid", "hyperthyroid", "asthma", "copd", "chronic",
    "cancer", "tumor", "malignant", "oncology", "chemotherapy", "radiation",
    "kidney disease", "renal", "dialysis", "liver disease", "hepatitis", "cirrhosis",
    "epilepsy", "seizure", "parkinson", "alzheimer", "dementia", "multiple sclerosis",
    "autoimmune", "lupus", "rheumatoid", "crohn", "colitis", "inflammatory",
    "hiv", "aids", "immunocompromised", "transplant", "allergy", "anaphylaxis",
    "schizophrenia", "bipolar", "depression chronic", "anxiety chronic",
    "osteoporosis", "arthritis", "fibromyalgia", "sickle cell", "thalassemia",
    "glaucoma", "macular degeneration", "retinopathy",
]

ACUTE_MAX_DAYS = 30   # Minor/acute records older than this are excluded


# ─── Cosine Similarity (pure Python) ─────────────────────────────────────────
def _cosine_similarity(vec_a: list, vec_b: list) -> float:
    """
    Computes cosine similarity between two dense float vectors.
    Returns a value between -1.0 and 1.0 (higher = more similar).
    """
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _is_chronic_record(record: HealthRecord) -> bool:
    """Check if a health record contains chronic/severe condition indicators."""
    text = (record.content or "").lower()
    return any(kw in text for kw in CHRONIC_KEYWORDS)


def _record_age_days(record: HealthRecord) -> int:
    """Returns how many days old this record is."""
    if not record.timestamp:
        return 0
    return (datetime.utcnow() - record.timestamp).days


# ─── Index: Save Record + Embedding ──────────────────────────────────────────
def index_health_record(
    db: Session,
    patient_id: int,
    content: str,
    record_type: str = "consultation"
) -> HealthRecord:
    """
    CHECKPOINT: Indexing New Medical Data into Vector Store

    1. Save the raw clinical text into the health_records relational table.
    2. Generate a 3072-dim semantic embedding vector for the text.
    3. Serialize the vector as a JSON string and store in vector_embeddings.
    """
    record = HealthRecord(
        patient_id=patient_id,
        content=content,
        record_type=record_type
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    try:
        vector = get_embedding(content)
        embedding_record = VectorEmbedding(
            record_id=record.id,
            embedding=json.dumps(vector)
        )
        db.add(embedding_record)
        db.commit()
    except Exception as e:
        print(f"[WARNING] Could not index embedding: {e}")
        db.rollback()

    return record


# ─── Retrieve: Find Semantically Relevant Records ────────────────────────────
def retrieve_relevant_history(
    db: Session,
    patient_id: int,
    query: str,
    top_k: int = 4
) -> str:
    """
    CHECKPOINT: Production RAG Retrieval — Smart Clinical Context Retrieval

    Rules:
    - Chronic/severe condition records: always eligible if similarity >= 0.60
    - Acute/minor records: only eligible if <= 30 days old AND similarity >= 0.65
    - Returns top_k records ranked by similarity, formatted for LLM injection
    - Fallback: most recent records if embedding API fails
    """
    try:
        # Step 1: Embed the incoming query
        query_vector = get_embedding(query)

        # Step 2: Load all records + embeddings for this patient
        rows = (
            db.query(VectorEmbedding, HealthRecord)
            .join(HealthRecord, VectorEmbedding.record_id == HealthRecord.id)
            .filter(HealthRecord.patient_id == patient_id)
            .all()
        )

        if not rows:
            return "No relevant past medical history found."

        # Step 3: Score and filter by date+type rules
        ranked = []
        for emb_row, rec_row in rows:
            try:
                stored_vec = json.loads(emb_row.embedding)
                similarity = _cosine_similarity(query_vector, stored_vec)
                age_days = _record_age_days(rec_row)
                is_chronic = _is_chronic_record(rec_row)

                # Filtering rules
                if is_chronic:
                    # Chronic records: lower threshold, always eligible
                    if similarity >= 0.60:
                        ranked.append((similarity, rec_row, is_chronic))
                else:
                    # Acute records: must be recent AND similar enough
                    if age_days <= ACUTE_MAX_DAYS and similarity >= 0.65:
                        ranked.append((similarity, rec_row, is_chronic))

            except Exception:
                continue

        # Step 4: Sort by similarity (chronic records get a +0.05 priority boost)
        ranked.sort(key=lambda x: x[0] + (0.05 if x[2] else 0), reverse=True)
        top_records = [rec for _, rec, _ in ranked[:top_k]]

    except Exception as e:
        print(f"[WARNING] RAG retrieval error, falling back to recent records: {e}")
        # Fallback: return most recent records
        top_records = (
            db.query(HealthRecord)
            .filter(HealthRecord.patient_id == patient_id)
            .order_by(HealthRecord.timestamp.desc())
            .limit(top_k)
            .all()
        )

    if not top_records:
        return "No relevant past medical history found."

    # Step 5: Format context string for LLM injection
    now = datetime.utcnow()
    parts = []
    for r in top_records:
        age_days = (now - r.timestamp).days if r.timestamp else 0
        age_label = f"{age_days}d ago" if age_days > 0 else "today"
        chronic_label = " [CHRONIC CONDITION]" if _is_chronic_record(r) else ""
        parts.append(
            f"Date: {r.timestamp.strftime('%Y-%m-%d')} ({age_label}){chronic_label} | Type: {r.record_type}\n"
            f"Details: {r.content}"
        )

    return "\n---\n".join(parts)
