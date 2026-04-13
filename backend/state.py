"""
Shared application state -- singleton dict loaded at startup by main.py lifespan.
Routers import from here to avoid circular imports with main.py.
"""

# Populated by main.py lifespan handler with:
#   model          - sklearn Pipeline (StandardScaler + LogisticRegression)
#   model_meta     - dict of feature columns, metrics, etc.
#   naics_stats    - pd.DataFrame of NAICS lookup
#   state_stats    - pd.DataFrame of state lookup
#   employer_stats - pd.DataFrame of employer lookup
app_state: dict = {}
