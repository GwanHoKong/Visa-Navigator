"""
POST /api/predict -- H1B sponsorship analytics endpoint.

The app now uses the dual-track modeling structure from H1B-Sponsorship-Analytics:

- Binary Logistic Regression estimates the probability that the selected profile
  maps to a High Approval Risk Tier.
- XGBoost Regression estimates the expected employer-year approval rate.
"""

from typing import Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from state import app_state

router = APIRouter()

NAICS_LABELS = {
    11: "Agriculture, Forestry, Fishing and Hunting",
    21: "Mining, Quarrying, and Oil and Gas Extraction",
    22: "Utilities",
    23: "Construction",
    31: "Manufacturing (Food, Textile, Apparel)",
    32: "Manufacturing (Wood, Paper, Chemical)",
    33: "Manufacturing (Metal, Machinery, Electronics)",
    42: "Wholesale Trade",
    44: "Retail Trade",
    45: "Retail Trade (Sporting, Hobby, General)",
    48: "Transportation and Warehousing",
    49: "Transportation and Warehousing (Postal, Courier)",
    51: "Information",
    52: "Finance and Insurance",
    53: "Real Estate and Rental and Leasing",
    54: "Professional, Scientific, and Technical Services",
    55: "Management of Companies and Enterprises",
    56: "Administrative and Support Services",
    61: "Educational Services",
    62: "Health Care and Social Assistance",
    71: "Arts, Entertainment, and Recreation",
    72: "Accommodation and Food Services",
    81: "Other Services",
    92: "Public Administration",
    99: "Unclassified",
}

RISK_FEATURES = [
    "fiscal_year",
    "log_petitions",
    "initial_share",
    "continuation_share",
    "missing_state_flag",
    "missing_naics_flag",
    "state",
]

REGRESSION_FEATURES = [
    "fiscal_year",
    "total_cases",
    "log_petitions",
    "initial_share",
    "continuation_share",
    "missing_state_flag",
    "missing_naics_flag",
    "industry_mean_rate",
    "industry_std",
    "industry_cv",
    "industry_employer_count",
    "industry_total_cases",
    "state",
]


class PredictRequest(BaseModel):
    industry: str
    state: str
    employer_name: Optional[str] = None

    @field_validator("industry")
    @classmethod
    def validate_industry(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("industry is required")
        return value

    @field_validator("state")
    @classmethod
    def validate_state(cls, value):
        value = value.strip().upper()
        if not value or len(value) != 2:
            raise ValueError("state must be a 2-letter abbreviation")
        return value


def _risk_level(high_risk_probability: float) -> str:
    if high_risk_probability >= 0.50:
        return "high"
    if high_risk_probability >= 0.25:
        return "medium"
    return "low"


def _safe_float(row, column: str, default: float) -> float:
    if row is None or column not in row.index:
        return default
    value = row[column]
    if pd.isna(value):
        return default
    return float(value)


@router.post("/predict")
async def predict(request: PredictRequest):
    try:
        risk_model = app_state["risk_model"]
        approval_model = app_state["approval_model"]
        model_meta = app_state["model_meta"]
        naics_df = app_state["naics_stats"]
        state_df = app_state["state_stats"]
        employer_df = app_state["employer_stats"]
    except KeyError:
        raise HTTPException(status_code=500, detail="Model artifacts not loaded. Server starting up.")

    naics_code = int(request.industry)
    state_code = request.state.upper()
    employer_name = request.employer_name.strip().upper() if request.employer_name else None

    national_avg = float(np.average(naics_df["avg_approval_rate"], weights=naics_df["total_cases"]))
    state_national_avg = float(np.average(state_df["avg_approval_rate"], weights=state_df["total_cases"]))

    explanation = []
    low_confidence = False
    employer_match = True

    naics_row_df = naics_df[naics_df["naics"] == naics_code]
    if naics_row_df.empty:
        naics_row = None
        industry_rate = national_avg
        industry_total = 0
        industry_label = f"Industry {naics_code}"
        industry_risk_tier = "Unknown"
        low_confidence = True
        explanation.append(f"Industry code {naics_code} was not found; national averages were used.")
    else:
        naics_row = naics_row_df.iloc[0]
        industry_rate = float(naics_row["avg_approval_rate"])
        industry_total = int(naics_row["total_cases"])
        industry_label = str(naics_row.get("label") or NAICS_LABELS.get(naics_code, f"Industry {naics_code}"))
        industry_risk_tier = str(naics_row.get("risk_tier") or "Unknown")
        if industry_total < 50:
            low_confidence = True
            explanation.append(f"{industry_label}: limited sample size ({industry_total:,} cases).")
        else:
            comp = "above" if industry_rate >= national_avg else "below"
            explanation.append(
                f"{industry_label}: {industry_rate * 100:.1f}% average approval rate, {comp} the national average."
            )

    state_row_df = state_df[state_df["state"] == state_code]
    if state_row_df.empty:
        state_rate = state_national_avg
        state_total = 0
        explanation.append(f"State {state_code} was not found; all-state average was used.")
    else:
        state_row = state_row_df.iloc[0]
        state_rate = float(state_row["avg_approval_rate"])
        state_total = int(state_row["total_cases"])
        explanation.append(f"{state_code}: {state_rate * 100:.1f}% average approval rate across {state_total:,} cases.")

    employer_rate = None
    employer_total = None
    employer_years = None
    base_total_cases = _safe_float(naics_row, "avg_total_cases", 1.0)
    log_petitions = _safe_float(naics_row, "avg_log_petitions", np.log1p(base_total_cases))
    initial_share = _safe_float(naics_row, "avg_initial_share", 0.5)
    continuation_share = _safe_float(naics_row, "avg_continuation_share", 0.5)

    if employer_name:
        emp_row_df = employer_df[employer_df["employer"] == employer_name]
        if emp_row_df.empty:
            employer_match = False
            explanation.append(f"Employer '{request.employer_name}' was not found; industry-level filing mix was used.")
        else:
            emp_row = emp_row_df.iloc[0]
            employer_rate = float(emp_row["approval_rate"])
            employer_total = int(emp_row["total_cases"])
            employer_years = int(emp_row["years_active"])
            base_total_cases = float(emp_row["total_cases"])
            log_petitions = _safe_float(emp_row, "log_petitions", np.log1p(base_total_cases))
            initial_share = _safe_float(emp_row, "initial_share", initial_share)
            continuation_share = _safe_float(emp_row, "continuation_share", continuation_share)
            explanation.append(
                f"{request.employer_name}: {employer_rate * 100:.1f}% average approval rate across "
                f"{employer_total:,} cases and {employer_years} active fiscal years."
            )

    prediction_year = int(model_meta.get("validation_year", 2025))
    feature_values = {
        "fiscal_year": prediction_year,
        "total_cases": base_total_cases,
        "log_petitions": log_petitions,
        "initial_share": initial_share,
        "continuation_share": continuation_share,
        "missing_state_flag": 0,
        "missing_naics_flag": 0 if naics_row is not None else 1,
        "industry_mean_rate": _safe_float(naics_row, "industry_mean_rate", industry_rate),
        "industry_std": _safe_float(naics_row, "industry_std", 0.0),
        "industry_cv": _safe_float(naics_row, "industry_cv", 0.0),
        "industry_employer_count": _safe_float(naics_row, "industry_employer_count", 0.0),
        "industry_total_cases": _safe_float(naics_row, "industry_total_cases", industry_total),
        "state": state_code,
    }

    feature_frame = pd.DataFrame([feature_values])
    high_risk_probability = float(risk_model.predict_proba(feature_frame[RISK_FEATURES])[0][1])
    expected_approval_rate = float(np.clip(approval_model.predict(feature_frame[REGRESSION_FEATURES])[0], 0, 1))
    risk_level = _risk_level(high_risk_probability)

    all_rates = employer_df["approval_rate"].dropna().values
    comparison_rate = employer_rate if employer_rate is not None else expected_approval_rate
    percentile = float(np.mean(all_rates <= comparison_rate) * 100)

    return {
        "probability": round(expected_approval_rate, 4),
        "expected_approval_rate": round(expected_approval_rate, 4),
        "high_risk_probability": round(high_risk_probability, 4),
        "risk_level": risk_level,
        "industry_risk_tier": industry_risk_tier,
        "explanation": explanation,
        "low_confidence": low_confidence,
        "employer_match": employer_match,
        "industry_rate": round(industry_rate, 4),
        "industry_label": industry_label,
        "industry_total": industry_total,
        "state_rate": round(state_rate, 4),
        "state_code": state_code,
        "state_total": state_total,
        "employer_rate": round(employer_rate, 4) if employer_rate is not None else None,
        "employer_total": employer_total,
        "employer_years": employer_years,
        "national_avg": round(national_avg, 4),
        "state_national_avg": round(state_national_avg, 4),
        "percentile": round(percentile, 1),
        "model_summary": {
            "source_project": model_meta.get("source_project", "H1B-Sponsorship-Analytics"),
            "risk_model": model_meta.get("risk_model", "Binary Logistic Regression"),
            "approval_model": model_meta.get("approval_model", "XGBoost Regressor"),
            "train_years": model_meta.get("train_years", [2021, 2022, 2023, 2024]),
            "validation_year": model_meta.get("validation_year", 2025),
        },
    }
