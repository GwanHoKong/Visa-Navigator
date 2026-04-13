"""
GET /api/companies -- Company recommendations filtered by industry and state.

Filtering:
- Same NAICS industry as user selection
- >= 50 total cases (fallback to >= 20 if 0 results)
- >= 2 fiscal years of data
- Approval rate above industry average

Ranking:
  score = (approval_rate * 0.6) + (normalized_case_volume * 0.3) + (years_active_ratio * 0.1)
"""

from fastapi import APIRouter, Query, HTTPException

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


def _filter_and_rank(employer_df, naics_code, state, industry_avg, min_cases, limit):
    """Core filtering and ranking logic, reusable for fallback."""
    filtered = employer_df[employer_df["primary_naics"] == naics_code].copy()

    if state:
        state = state.strip().upper()
        filtered = filtered[filtered["primary_state"] == state]

    filtered = filtered[filtered["total_cases"] >= min_cases]
    filtered = filtered[filtered["years_active"] >= 2]
    filtered = filtered[filtered["approval_rate"] >= industry_avg]

    if filtered.empty:
        return filtered, []

    max_cases = filtered["total_cases"].max()
    max_years = filtered["years_active"].max()
    if max_cases == 0:
        max_cases = 1
    if max_years == 0:
        max_years = 1

    filtered = filtered.copy()
    filtered["normalized_cases"] = filtered["total_cases"] / max_cases
    filtered["years_ratio"] = filtered["years_active"] / max_years
    filtered["score"] = (
        filtered["approval_rate"] * 0.6
        + filtered["normalized_cases"] * 0.3
        + filtered["years_ratio"] * 0.1
    )

    top = filtered.nlargest(limit, "score")

    companies = []
    for _, row in top.iterrows():
        companies.append({
            "name": row["employer"],
            "approval_rate": round(float(row["approval_rate"]), 4),
            "total_cases": int(row["total_cases"]),
            "primary_state": row["primary_state"],
            "years_active": int(row["years_active"]),
            "industry_label": NAICS_LABELS.get(naics_code, f"Industry {naics_code}"),
            "vs_industry_avg": round(float(row["approval_rate"]) - industry_avg, 4),
            "score": round(float(row["score"]), 4),
        })

    return filtered, companies


@router.get("/companies")
async def get_companies(
    industry: str = Query(..., description="NAICS industry code"),
    state: str = Query(None, description="U.S. state abbreviation (optional filter)"),
    limit: int = Query(10, description="Max number of companies to return", ge=1, le=50),
):
    try:
        employer_df = app_state["employer_stats"]
        naics_df = app_state["naics_stats"]
    except KeyError:
        raise HTTPException(status_code=500, detail="Lookup tables not loaded.")

    naics_code = int(industry)

    naics_row = naics_df[naics_df["naics"] == naics_code]
    if naics_row.empty:
        industry_avg = employer_df["approval_rate"].mean()
    else:
        industry_avg = float(naics_row.iloc[0]["avg_approval_rate"])

    national_avg = float(naics_df["avg_approval_rate"].mean())

    # Progressive relaxation to always fill `limit` results
    collected = []
    seen_employers = set()
    relaxation_steps = []

    # Build relaxation steps: (state_filter, min_cases, tag)
    if state:
        state = state.strip().upper()
        relaxation_steps = [
            (state, 50, "exact"),          # Step 1: same state, >=50 cases
            (state, 20, "relaxed_cases"),   # Step 2: same state, >=20 cases
            (None,  20, "other_states"),    # Step 3: all states, >=20 cases
            (None,  5,  "other_states"),    # Step 4: all states, >=5 cases
        ]
    else:
        relaxation_steps = [
            (None, 50, "exact"),
            (None, 20, "relaxed_cases"),
            (None, 5,  "relaxed_cases"),
        ]

    relaxed = False
    messages = []

    for step_state, min_cases, tag in relaxation_steps:
        if len(collected) >= limit:
            break

        remaining = limit - len(collected)
        _, step_companies = _filter_and_rank(
            employer_df, naics_code, step_state, industry_avg, min_cases, remaining + len(seen_employers) + 20
        )

        for c in step_companies:
            if len(collected) >= limit:
                break
            if c["name"] in seen_employers:
                continue
            seen_employers.add(c["name"])
            c["source"] = tag
            collected.append(c)

        if tag != "exact" and len(collected) > 0:
            relaxed = True

    if not collected:
        return {
            "companies": [],
            "industry_avg": round(industry_avg, 4),
            "national_avg": round(national_avg, 4),
            "total_matching": 0,
            "relaxed": False,
            "message": "No companies match the current filters. Try removing the state filter or selecting a different industry.",
        }

    # Build message describing what happened
    exact_count = sum(1 for c in collected if c["source"] == "exact")
    relaxed_count = sum(1 for c in collected if c["source"] == "relaxed_cases")
    other_count = sum(1 for c in collected if c["source"] == "other_states")

    msg_parts = []
    if exact_count > 0:
        msg_parts.append(f"{exact_count} from your selected state")
    if relaxed_count > 0:
        msg_parts.append(f"{relaxed_count} with relaxed case threshold")
    if other_count > 0:
        msg_parts.append(f"{other_count} from other states in the same industry")

    result = {
        "companies": collected,
        "industry_avg": round(industry_avg, 4),
        "national_avg": round(national_avg, 4),
        "total_matching": len(collected),
        "relaxed": relaxed,
    }

    if relaxed:
        result["message"] = "Results include: " + ", ".join(msg_parts) + "."

    return result

