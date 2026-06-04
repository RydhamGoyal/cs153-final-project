from pydantic import BaseModel
from typing import Optional

class AnalyzeRequest(BaseModel):
    # model_mode would otherwise collide with pydantic's protected "model_" namespace
    model_config = {"protected_namespaces": ()}
    device_description: str
    indications_for_use: str
    model_mode: str = "openrouter"  # "openrouter" | "finetuned"

class DeviceRecord(BaseModel):
    k_number: str
    device_name: str
    applicant: Optional[str] = None
    product_code: Optional[str] = None
    decision_date: Optional[str] = None
    device_class: Optional[str] = None
    regulation_number: Optional[str] = None
    has_recall: bool = False
    recall_count: int = 0
    similarity_score: Optional[float] = None

class PredicateChainNode(BaseModel):
    k_number: str
    device_name: str
    decision_date: Optional[str] = None
    applicant: Optional[str] = None
    product_code: Optional[str] = None
    has_recall: bool = False
    depth: int  # 0 = the device itself, 1 = direct predicate, 2 = predicate's predicate, etc.

class SEMatrix(BaseModel):
    candidate_k_number: str
    candidate_name: str
    same_intended_use: bool
    same_intended_use_explanation: str
    same_technological_characteristics: bool
    technological_differences: list[str]
    raises_safety_questions: bool
    additional_testing_required: list[str]
    se_likelihood_score: int  # 0-100
    recommendation: str  # "strong", "viable", "weak", "not_recommended"

class AnalyzeResponse(BaseModel):
    classification: dict
    candidates: list[DeviceRecord]
    predicate_chains: dict[str, list[PredicateChainNode]]  # k_number -> chain
    se_analysis: list[SEMatrix]
    recommendation: dict
    processing_steps: list[dict]  # for the frontend progress display

class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    faiss_loaded: bool
    device_count: int
