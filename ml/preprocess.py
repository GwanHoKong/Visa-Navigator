"""
Data preprocessing pipeline for H1B visa data.

Steps (from CLAUDE.md):
1. Convert 2024–2026 from UTF-16LE TSV to UTF-8
2. Standardize column names: employer, naics, state, city, zip, fiscal_year
3. Merge approval/denial columns into total_approvals / total_denials
4. Extract numeric NAICS from 2024–2026 labels ("54 - Professional..." → 54)
5. Binary target: approved = 1 if total_approvals > 0 AND total_denials == 0, else 0
6. Handle rows with missing employer names
"""

import pandas as pd
import numpy as np
from pathlib import Path
import re
import sys

DATA_DIR = Path(__file__).parent.parent / "data"

# ---------------------------------------------------------------------------
# Column mappings
# ---------------------------------------------------------------------------

# 2021-2023 format: CSV, UTF-8, 11 columns
COLS_OLD = {
    "Fiscal Year": "fiscal_year",
    "Employer": "employer",
    "Initial Approval": "initial_approval",
    "Initial Denial": "initial_denial",
    "Continuing Approval": "continuing_approval",
    "Continuing Denial": "continuing_denial",
    "NAICS": "naics",
    "Tax ID": "tax_id",
    "State": "state",
    "City": "city",
    "ZIP": "zip",
}

# 2024-2026 format: TSV, UTF-16LE, 20 columns
# Approval columns to sum
APPROVAL_COLS_NEW = [
    "New Employment Approval",
    "Continuation Approval",
    "Change with Same Employer Approval",
    "New Concurrent Approval",
    "Change of Employer Approval",
    "Amended Approval",
]

# Denial columns to sum
DENIAL_COLS_NEW = [
    "New Employment Denial",
    "Continuation Denial",
    "Change with Same Employer Denial",
    "New Concurrent Denial",
    "Change of Employer Denial",
    "Amended Denial",
]


# ---------------------------------------------------------------------------
# Loading functions
# ---------------------------------------------------------------------------

def load_old_format(filepath: Path) -> pd.DataFrame:
    """Load 2021-2023 CSV files (UTF-8, comma-separated)."""
    df = pd.read_csv(filepath, encoding="utf-8", dtype=str)
    df = df.rename(columns=COLS_OLD)

    # Convert approval/denial columns to int
    for col in ["initial_approval", "initial_denial", "continuing_approval", "continuing_denial"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    # Merge into total_approvals / total_denials
    df["total_approvals"] = df["initial_approval"] + df["continuing_approval"]
    df["total_denials"] = df["initial_denial"] + df["continuing_denial"]

    # NAICS is already numeric in old format
    df["naics"] = pd.to_numeric(df["naics"], errors="coerce")

    # Keep standardized columns
    df = df[["fiscal_year", "employer", "naics", "tax_id", "state", "city", "zip",
             "total_approvals", "total_denials"]]
    return df


def load_new_format(filepath: Path) -> pd.DataFrame:
    """Load 2024-2026 TSV files (UTF-16LE, tab-separated)."""
    df = pd.read_csv(filepath, encoding="utf-16-le", sep="\t", dtype=str)

    # Clean column names: strip whitespace and BOM characters
    df.columns = df.columns.str.strip().str.replace("\ufeff", "")

    # Rename to standardized names
    rename_map = {
        "Fiscal Year": "fiscal_year",
        "Employer (Petitioner) Name": "employer",
        "Tax ID": "tax_id",
        "Industry (NAICS) Code": "naics_raw",
        "Petitioner City": "city",
        "Petitioner State": "state",
        "Petitioner Zip Code": "zip",
    }
    df = df.rename(columns=rename_map)

    # Drop the "Line by line" index column
    if "Line by line" in df.columns:
        df = df.drop(columns=["Line by line"])

    # Convert approval/denial columns to int and sum
    for col in APPROVAL_COLS_NEW + DENIAL_COLS_NEW:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    df["total_approvals"] = df[APPROVAL_COLS_NEW].sum(axis=1)
    df["total_denials"] = df[DENIAL_COLS_NEW].sum(axis=1)

    # Extract numeric NAICS: "54 - Professional..." → 54
    df["naics"] = df["naics_raw"].apply(extract_naics_code)

    # Keep standardized columns
    df = df[["fiscal_year", "employer", "naics", "tax_id", "state", "city", "zip",
             "total_approvals", "total_denials"]]
    return df


def extract_naics_code(val):
    """Extract numeric NAICS code from label like '54 - Professional...' or '44-45 - Retail Trade'."""
    if pd.isna(val):
        return np.nan
    val = str(val).strip()
    # Match patterns: "54", "54 - ...", "44-45", "44-45 - ..."
    match = re.match(r"^(\d{2}(?:-\d{2})?)", val)
    if match:
        code = match.group(1)
        # For ranges like "44-45", use the first number
        if "-" in code:
            code = code.split("-")[0]
        return int(code)
    # Try direct numeric conversion
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return np.nan


# ---------------------------------------------------------------------------
# Main preprocessing pipeline
# ---------------------------------------------------------------------------

def load_and_preprocess() -> pd.DataFrame:
    """Load all 6 years of raw data and return a unified, cleaned DataFrame."""
    frames = []

    # Load 2021-2023 (old format)
    for year in [2021, 2022, 2023]:
        filepath = DATA_DIR / f"H1B Employer Data {year}.csv"
        if filepath.exists():
            print(f"Loading {filepath.name} (CSV/UTF-8)...")
            df = load_old_format(filepath)
            frames.append(df)
            print(f"  -> {len(df):,} rows loaded")
        else:
            print(f"  [!] File not found: {filepath.name}")

    # Load 2024-2026 (new format)
    for year in [2024, 2025, 2026]:
        filepath = DATA_DIR / f"H1B Employer Data {year}.csv"
        if filepath.exists():
            print(f"Loading {filepath.name} (TSV/UTF-16LE)...")
            df = load_new_format(filepath)
            frames.append(df)
            print(f"  -> {len(df):,} rows loaded")
        else:
            print(f"  [!] File not found: {filepath.name}")

    if not frames:
        raise FileNotFoundError("No data files found in data/ directory")

    # Concatenate all years
    combined = pd.concat(frames, ignore_index=True)
    print(f"\nCombined: {len(combined):,} total rows")

    # ----- Clean fiscal_year -----
    combined["fiscal_year"] = pd.to_numeric(
        combined["fiscal_year"].astype(str).str.strip(), errors="coerce"
    ).astype("Int64")

    # ----- Handle missing employer names (Step 6) -----
    missing_employer = combined["employer"].isna() | (combined["employer"].str.strip() == "")
    print(f"Rows with missing employer name: {missing_employer.sum()}")
    combined.loc[missing_employer, "employer"] = "UNKNOWN_EMPLOYER"

    # ----- Standardize employer names -----
    combined["employer"] = combined["employer"].str.strip().str.upper()

    # ----- Standardize state -----
    combined["state"] = combined["state"].str.strip().str.upper()

    # ----- Binary target (Step 5) -----
    # approved = 1 if total_approvals > 0 AND total_denials == 0, else 0
    combined["approved"] = (
        (combined["total_approvals"] > 0) & (combined["total_denials"] == 0)
    ).astype(int)

    # ----- Drop rows with no NAICS -----
    naics_missing = combined["naics"].isna().sum()
    print(f"Rows with missing NAICS: {naics_missing}")
    combined["naics"] = combined["naics"].astype("Int64")

    # ----- Summary stats -----
    print(f"\n{'='*60}")
    print(f"Final dataset: {len(combined):,} rows")
    print(f"Years: {sorted(combined['fiscal_year'].dropna().unique().tolist())}")
    print(f"Unique employers: {combined['employer'].nunique():,}")
    print(f"Unique NAICS codes: {combined['naics'].dropna().nunique()}")
    print(f"Unique states: {combined['state'].dropna().nunique()}")
    print(f"Approval rate: {combined['approved'].mean():.4f} ({combined['approved'].mean()*100:.1f}%)")
    print(f"  - Approved (target=1): {combined['approved'].sum():,}")
    print(f"  - Not fully approved (target=0): {(combined['approved'] == 0).sum():,}")
    print(f"{'='*60}")

    return combined


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute aggregate features (from CLAUDE.md):
    - approval_rate_by_naics, std_dev_by_naics
    - employer_approval_rate, employer_total_cases, employer_years_active, employer_size_flag
    - state_approval_rate, state_total_cases
    - fiscal_year

    IMPORTANT: Do NOT use raw employer names as categorical features.
    Use aggregated statistics only.
    """
    print("\nEngineering features...")

    # ----- Industry-level features -----
    naics_stats = df.groupby("naics").agg(
        approval_rate_by_naics=("approved", "mean"),
        std_dev_by_naics=("approved", "std"),
        naics_total_cases=("approved", "count"),
    ).reset_index()
    naics_stats["std_dev_by_naics"] = naics_stats["std_dev_by_naics"].fillna(0)

    # ----- Employer-level features -----
    employer_stats = df.groupby("employer").agg(
        employer_approval_rate=("approved", "mean"),
        employer_total_cases=("approved", "count"),
        employer_years_active=("fiscal_year", "nunique"),
    ).reset_index()

    # employer_size_flag: large (>50 cases) / small (<5 cases) / medium (else)
    employer_stats["employer_size_flag"] = "medium"
    employer_stats.loc[employer_stats["employer_total_cases"] > 50, "employer_size_flag"] = "large"
    employer_stats.loc[employer_stats["employer_total_cases"] < 5, "employer_size_flag"] = "small"

    # ----- State-level features -----
    state_stats = df.groupby("state").agg(
        state_approval_rate=("approved", "mean"),
        state_total_cases=("approved", "count"),
    ).reset_index()

    # ----- Merge features back -----
    df = df.merge(naics_stats, on="naics", how="left")
    df = df.merge(employer_stats, on="employer", how="left")
    df = df.merge(state_stats, on="state", how="left")

    # ----- Encode employer_size_flag -----
    size_map = {"small": 0, "medium": 1, "large": 2}
    df["employer_size_encoded"] = df["employer_size_flag"].map(size_map).fillna(1).astype(int)

    # ----- Summary -----
    feature_cols = [
        "fiscal_year", "approval_rate_by_naics", "std_dev_by_naics",
        "employer_approval_rate", "employer_total_cases", "employer_years_active",
        "employer_size_encoded", "state_approval_rate", "state_total_cases",
    ]
    print(f"Feature columns: {feature_cols}")
    print(f"Target column: approved")
    print(f"\nFeature statistics:")
    print(df[feature_cols].describe().round(4).to_string())

    return df


if __name__ == "__main__":
    # Step 1: Load and preprocess
    df = load_and_preprocess()

    # Step 2: Engineer features
    df = engineer_features(df)

    # Step 3: Save processed dataset
    output_path = DATA_DIR / "processed.csv"
    df.to_csv(output_path, index=False)
    print(f"\n[OK] Saved processed data to {output_path}")
    print(f"     File size: {output_path.stat().st_size / 1024 / 1024:.1f} MB")

    # Step 4: Save lookup tables for backend
    lookups_dir = Path(__file__).parent.parent / "backend" / "lookups"

    # Industry lookup
    naics_lookup = df.groupby("naics").agg(
        label=("naics", "first"),  # placeholder -- can map NAICS labels later
        avg_approval_rate=("approved", "mean"),
        total_cases=("approved", "count"),
    ).reset_index()
    naics_lookup.to_csv(lookups_dir / "naics_stats.csv", index=False)
    print(f"[OK] Saved NAICS lookup to {lookups_dir / 'naics_stats.csv'}")

    # State lookup
    state_lookup = df.groupby("state").agg(
        avg_approval_rate=("approved", "mean"),
        total_cases=("approved", "count"),
    ).reset_index()
    state_lookup.to_csv(lookups_dir / "state_stats.csv", index=False)
    print(f"[OK] Saved state lookup to {lookups_dir / 'state_stats.csv'}")

    # Employer lookup
    employer_lookup = df.groupby("employer").agg(
        approval_rate=("approved", "mean"),
        total_cases=("approved", "count"),
        years_active=("fiscal_year", "nunique"),
        primary_state=("state", lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else ""),
        primary_naics=("naics", lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else None),
    ).reset_index()
    employer_lookup = employer_lookup[employer_lookup["employer"] != "UNKNOWN_EMPLOYER"]
    employer_lookup.to_csv(lookups_dir / "employer_stats.csv", index=False)
    print(f"[OK] Saved employer lookup to {lookups_dir / 'employer_stats.csv'}")
    print(f"     {len(employer_lookup):,} unique employers")
