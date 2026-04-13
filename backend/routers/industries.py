"""
GET /api/industries -- Returns list of NAICS industries with average approval rates.
"""

from fastapi import APIRouter, HTTPException

from state import app_state

router = APIRouter()

# NAICS code -> human-readable label
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


@router.get("/industries")
async def get_industries():
    try:
        naics_df = app_state["naics_stats"]
    except KeyError:
        raise HTTPException(status_code=500, detail="Lookup tables not loaded.")

    industries = []
    for _, row in naics_df.iterrows():
        code = int(row["naics"])
        industries.append({
            "code": str(code),
            "label": NAICS_LABELS.get(code, f"Industry {code}"),
            "avg_approval_rate": round(float(row["avg_approval_rate"]), 4),
            "total_cases": int(row["total_cases"]),
        })

    # Sort by label for frontend display
    industries.sort(key=lambda x: x["label"])

    return {"industries": industries}
