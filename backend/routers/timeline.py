"""
GET /api/timeline -- Personalized visa timeline based on graduation date and visa type.

Generates key dates and milestones for OPT, STEM OPT, and H1B processes.
"""

from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()


def parse_date(date_str: str) -> datetime:
    """Parse a date string in YYYY-MM-DD format."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid date format: '{date_str}'. Expected YYYY-MM-DD."
        )


def make_milestone(date: datetime, title: str, description: str, category: str = "deadline"):
    return {
        "date": date.strftime("%Y-%m-%d"),
        "title": title,
        "description": description,
        "category": category,
    }


def generate_opt_timeline(grad_date: datetime):
    """Generate OPT timeline milestones."""
    key_dates = []
    milestones = []

    # Earliest application: 90 days before graduation
    earliest_apply = grad_date - timedelta(days=90)
    key_dates.append({"label": "Earliest OPT Application", "date": earliest_apply.strftime("%Y-%m-%d")})
    milestones.append(make_milestone(
        earliest_apply,
        "Earliest OPT Application",
        "You can start applying for OPT up to 90 days before graduation.",
        "action"
    ))

    # Recommended: request DSO recommendation ~60 days before
    dso_recommend = grad_date - timedelta(days=60)
    milestones.append(make_milestone(
        dso_recommend,
        "Request DSO Recommendation",
        "Request your DSO to recommend OPT in SEVIS. Allow processing time.",
        "action"
    ))

    # Graduation
    milestones.append(make_milestone(
        grad_date,
        "Graduation Date",
        "Your program end date as recorded in SEVIS.",
        "milestone"
    ))

    # Latest application: 60 days after graduation
    latest_apply = grad_date + timedelta(days=60)
    key_dates.append({"label": "Latest OPT Application", "date": latest_apply.strftime("%Y-%m-%d")})
    milestones.append(make_milestone(
        latest_apply,
        "OPT Application Deadline",
        "Last day to file Form I-765 for post-completion OPT.",
        "deadline"
    ))

    # EAD processing: ~3-5 months
    ead_estimate = grad_date + timedelta(days=120)
    milestones.append(make_milestone(
        ead_estimate,
        "EAD Card (estimated)",
        "Expect to receive your Employment Authorization Document within 3-5 months.",
        "milestone"
    ))

    # OPT end: 12 months after graduation
    opt_end = grad_date + timedelta(days=365)
    key_dates.append({"label": "OPT Expiration", "date": opt_end.strftime("%Y-%m-%d")})
    milestones.append(make_milestone(
        opt_end,
        "OPT Expiration",
        "Your 12-month OPT period ends. Apply for STEM extension before this date if eligible.",
        "deadline"
    ))

    return key_dates, milestones


def generate_stem_opt_timeline(grad_date: datetime):
    """Generate STEM OPT extension timeline."""
    key_dates = []
    milestones = []

    opt_end = grad_date + timedelta(days=365)

    # Earliest STEM application: 90 days before OPT expires
    earliest_stem = opt_end - timedelta(days=90)
    key_dates.append({"label": "Earliest STEM Extension Application", "date": earliest_stem.strftime("%Y-%m-%d")})
    milestones.append(make_milestone(
        earliest_stem,
        "Earliest STEM OPT Application",
        "You can apply for STEM extension up to 90 days before OPT expires.",
        "action"
    ))

    # Complete I-983 with employer
    i983_deadline = opt_end - timedelta(days=60)
    milestones.append(make_milestone(
        i983_deadline,
        "Complete Form I-983",
        "Work with your employer to complete the Training Plan (Form I-983).",
        "action"
    ))

    # OPT expiration / STEM deadline
    key_dates.append({"label": "OPT Expiration (STEM Deadline)", "date": opt_end.strftime("%Y-%m-%d")})
    milestones.append(make_milestone(
        opt_end,
        "STEM Extension Deadline",
        "You must file the STEM OPT extension before your OPT expires.",
        "deadline"
    ))

    # 6-month I-983 evaluation
    eval_6mo = opt_end + timedelta(days=180)
    milestones.append(make_milestone(
        eval_6mo,
        "6-Month I-983 Evaluation",
        "Submit your first I-983 evaluation to your DSO.",
        "deadline"
    ))

    # 12-month evaluation
    eval_12mo = opt_end + timedelta(days=365)
    milestones.append(make_milestone(
        eval_12mo,
        "12-Month I-983 Evaluation",
        "Submit your second I-983 evaluation to your DSO.",
        "deadline"
    ))

    # STEM OPT end: 24 months after initial OPT end
    stem_end = opt_end + timedelta(days=730)
    key_dates.append({"label": "STEM OPT Expiration", "date": stem_end.strftime("%Y-%m-%d")})
    milestones.append(make_milestone(
        stem_end,
        "STEM OPT Expiration",
        "Your 24-month STEM extension ends (36 months total from graduation).",
        "deadline"
    ))

    return key_dates, milestones


def generate_h1b_timeline(grad_date: datetime):
    """Generate H1B timeline relative to graduation date."""
    key_dates = []
    milestones = []

    grad_year = grad_date.year

    # H1B registration typically in March following graduation
    # If graduating in spring, first H1B lottery is next March
    if grad_date.month <= 6:
        lottery_year = grad_year + 1
    else:
        lottery_year = grad_year + 1

    # H1B registration opens
    reg_open = datetime(lottery_year, 3, 1)
    key_dates.append({"label": "H1B Registration Opens", "date": reg_open.strftime("%Y-%m-%d")})
    milestones.append(make_milestone(
        reg_open,
        "H1B Registration Opens",
        "Employer must register for the H1B lottery during March 1-17.",
        "action"
    ))

    # Registration closes
    reg_close = datetime(lottery_year, 3, 17)
    milestones.append(make_milestone(
        reg_close,
        "H1B Registration Closes",
        "Last day for employer to submit electronic registration.",
        "deadline"
    ))

    # Results
    results = datetime(lottery_year, 3, 31)
    key_dates.append({"label": "Lottery Results", "date": results.strftime("%Y-%m-%d")})
    milestones.append(make_milestone(
        results,
        "Lottery Results Announced",
        "USCIS notifies if your registration was selected in the lottery.",
        "milestone"
    ))

    # Petition filing deadline (~90 days after selection)
    petition_deadline = results + timedelta(days=90)
    milestones.append(make_milestone(
        petition_deadline,
        "Petition Filing Deadline",
        "Employer must file full I-129 petition within 90 days of selection.",
        "deadline"
    ))

    # H1B start date
    h1b_start = datetime(lottery_year, 10, 1)
    key_dates.append({"label": "H1B Start Date", "date": h1b_start.strftime("%Y-%m-%d")})
    milestones.append(make_milestone(
        h1b_start,
        "H1B Status Begins",
        "Earliest date H1B employment can start. Cap-gap extends OPT until this date.",
        "milestone"
    ))

    return key_dates, milestones


@router.get("/timeline")
async def get_timeline(
    graduation_date: str = Query(..., description="Graduation date (YYYY-MM-DD)"),
    visa_type: str = Query(..., description="Visa type: opt | stem-opt | h1b"),
):
    grad_date = parse_date(graduation_date)
    visa_type = visa_type.lower().strip()

    generators = {
        "opt": generate_opt_timeline,
        "stem-opt": generate_stem_opt_timeline,
        "h1b": generate_h1b_timeline,
    }

    if visa_type not in generators:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid visa_type: '{visa_type}'. Must be one of: opt, stem-opt, h1b"
        )

    key_dates, milestones = generators[visa_type](grad_date)

    return {
        "visa_type": visa_type,
        "graduation_date": graduation_date,
        "key_dates": key_dates,
        "milestones": milestones,
    }
