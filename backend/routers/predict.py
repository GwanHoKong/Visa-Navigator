"""
POST /api/predict -- H1B approval risk assessment endpoint.
Returns detailed breakdown: industry rate, state rate, employer rate,
national averages, and percentile ranking.

Error handling (from CLAUDE.md):
- Industry with < 5 cases: 200 + low_confidence: true
- Employer not found: 200 + employer_match: false, show industry/state risk only
- Invalid/missing fields: 422 Validation Error
- Server error: 500
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
import numpy as np

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


class PredictRequest(BaseModel):
    industry: str
    state: str
    employer_name: Optional[str] = None

    @field_validator("industry")
    @classmethod
    def validate_industry(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("industry is required")
        return v

    @field_validator("state")
    @classmethod
    def validate_state(cls, v):
        v = v.strip().upper()
        if not v or len(v) != 2:
            raise ValueError("state must be a 2-letter abbreviation")
        return v


@router.post("/predict")
async def predict(request: PredictRequest):
    try:
        model = app_state["model"]
        naics_df = app_state["naics_stats"]
        state_df = app_state["state_stats"]
        employer_df = app_state["employer_stats"]
    except KeyError:
        raise HTTPException(status_code=500, detail="Model not loaded. Server starting up.")

    naics_code = int(request.industry)
    state_code = request.state.upper()
    employer_name = request.employer_name.strip().upper() if request.employer_name else None

    # -- National average (across all industries) --
    national_avg = float(naics_df["avg_approval_rate"].mean())

    explanation = []
    low_confidence = False
    employer_match = True

    # -- Industry stats --
    naics_row = naics_df[naics_df["naics"] == naics_code]
    if naics_row.empty:
        industry_rate = national_avg
        industry_total = 0
        industry_label = f"Industry {naics_code}"
        explanation.append(f"Industry code {naics_code} not found; using national average")
        low_confidence = True
    else:
        industry_rate = float(naics_row.iloc[0]["avg_approval_rate"])
        industry_total = int(naics_row.iloc[0]["total_cases"])
        industry_label = NAICS_LABELS.get(naics_code, f"Industry {naics_code}")
        if industry_total < 5:
            low_confidence = True
            explanation.append(f"{industry_label}: only {industry_total} cases (limited data)")
        else:
            comp = "above" if industry_rate > national_avg else "below"
            explanation.append(
                f"{industry_label}: {industry_rate*100:.1f}% approval ({comp} {national_avg*100:.1f}% national avg)"
            )

    # -- State stats --
    state_row = state_df[state_df["state"] == state_code]
    if state_row.empty:
        state_rate = national_avg
        state_total = 0
        explanation.append(f"State {state_code} not found; using national average")
    else:
        state_rate = float(state_row.iloc[0]["avg_approval_rate"])
        state_total = int(state_row.iloc[0]["total_cases"])
        explanation.append(f"{state_code}: {state_rate*100:.1f}% approval rate ({state_total:,} cases)")

    # National average for state comparison
    state_national_avg = float(state_df["avg_approval_rate"].mean())

    # -- Employer stats --
    emp_rate = None
    emp_total_cases = 1
    emp_years_active = 1
    emp_size_encoded = 0
    emp_approval_for_model = industry_rate  # default

    if employer_name:
        emp_row = employer_df[employer_df["employer"] == employer_name]
        if emp_row.empty:
            employer_match = False
            explanation.append(f"Employer '{request.employer_name}' not found in database")
        else:
            employer_match = True
            emp_rate = float(emp_row.iloc[0]["approval_rate"])
            emp_total_cases = int(emp_row.iloc[0]["total_cases"])
            emp_years_active = int(emp_row.iloc[0]["years_active"])
            emp_approval_for_model = emp_rate
            if emp_total_cases > 50:
                emp_size_encoded = 2
            elif emp_total_cases >= 5:
                emp_size_encoded = 1
            explanation.append(
                f"{request.employer_name}: {emp_rate*100:.1f}% across {emp_total_cases:,} cases ({emp_years_active} yrs)"
            )

    # -- Percentile: what fraction of employers have a WORSE combined rate? --
    # Approximate: use the combined (industry+state+employer) average
    user_combined = np.mean([industry_rate, state_rate, emp_approval_for_model])
    # Compare to all employers' approval rates
    all_rates = employer_df["approval_rate"].dropna().values
    percentile = float(np.mean(all_rates <= user_combined) * 100)

    # -- Build feature vector & predict --
    naics_std = 0.3  # approximation
    features = np.array([[
        2025, industry_rate, naics_std,
        emp_approval_for_model, emp_total_cases, emp_years_active,
        emp_size_encoded, state_rate, state_total,
    ]])
    probability = float(model.predict_proba(features)[0][1])

    if probability >= 0.80:
        risk_level = "low"
    elif probability >= 0.50:
        risk_level = "medium"
    else:
        risk_level = "high"

    return {
        "probability": round(probability, 4),
        "risk_level": risk_level,
        "explanation": explanation,
        "low_confidence": low_confidence,
        "employer_match": employer_match,
        # Detailed breakdown for frontend display
        "industry_rate": round(industry_rate, 4),
        "industry_label": industry_label,
        "industry_total": industry_total,
        "state_rate": round(state_rate, 4),
        "state_code": state_code,
        "state_total": state_total,
        "employer_rate": round(emp_rate, 4) if emp_rate is not None else None,
        "employer_total": emp_total_cases if emp_rate is not None else None,
        "employer_years": emp_years_active if emp_rate is not None else None,
        "national_avg": round(national_avg, 4),
        "state_national_avg": round(state_national_avg, 4),
        "percentile": round(percentile, 1),
    }
