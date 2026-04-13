"""
Model training script for H1B approval prediction.

Spec (from CLAUDE.md):
- Algorithm: Logistic Regression, class_weight="balanced", solver="liblinear"
- Scaling: StandardScaler on all numeric features
- CV: 5-fold stratified cross-validation
- Train: 2021-2024 | Test: 2025 | Exclude: 2026 (partial)
- Persistence: Save with joblib -> load at FastAPI startup

Evaluation Metrics (accuracy is NOT primary):
- AUC-ROC > 0.70
- Denial Recall > 0.30
- Denial Precision > 0.10

If Logistic Regression < 0.70 AUC-ROC -> try fallback models.
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import (
    roc_auc_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix,
)
from sklearn.pipeline import Pipeline

DATA_DIR = Path(__file__).parent.parent / "data"
MODEL_DIR = Path(__file__).parent.parent / "backend" / "models"

# Features used for training (from CLAUDE.md feature engineering)
FEATURE_COLS = [
    "fiscal_year",
    "approval_rate_by_naics",
    "std_dev_by_naics",
    "employer_approval_rate",
    "employer_total_cases",
    "employer_years_active",
    "employer_size_encoded",
    "state_approval_rate",
    "state_total_cases",
]

TARGET_COL = "approved"


def load_data():
    """Load processed data and split into train (2021-2024) and test (2025)."""
    filepath = DATA_DIR / "processed.csv"
    print(f"Loading processed data from {filepath.name}...")
    df = pd.read_csv(filepath)

    # Exclude 2026 (partial year)
    df = df[df["fiscal_year"] != 2026].copy()
    print(f"  After excluding 2026: {len(df):,} rows")

    # Split by year
    train_df = df[df["fiscal_year"].isin([2021, 2022, 2023, 2024])].copy()
    test_df = df[df["fiscal_year"] == 2025].copy()

    print(f"  Train (2021-2024): {len(train_df):,} rows")
    print(f"  Test  (2025):      {len(test_df):,} rows")
    print(f"  Train approval rate: {train_df[TARGET_COL].mean():.4f}")
    print(f"  Test  approval rate: {test_df[TARGET_COL].mean():.4f}")

    return train_df, test_df


def prepare_features(df):
    """Extract feature matrix X and target vector y, dropping rows with NaN features."""
    subset = df[FEATURE_COLS + [TARGET_COL]].dropna()
    dropped = len(df) - len(subset)
    if dropped > 0:
        print(f"  Dropped {dropped:,} rows with NaN features")

    X = subset[FEATURE_COLS].values
    y = subset[TARGET_COL].values
    return X, y


def evaluate_model(model, X, y, dataset_name="Test"):
    """Evaluate model and print detailed metrics."""
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1]

    # AUC-ROC
    auc = roc_auc_score(y, y_proba)

    # Precision, Recall, F1 for denial class (target=0)
    precision, recall, f1, support = precision_recall_fscore_support(
        y, y_pred, labels=[0, 1], zero_division=0
    )

    # Confusion matrix
    cm = confusion_matrix(y, y_pred, labels=[0, 1])

    print(f"\n{'='*60}")
    print(f"  {dataset_name} Set Evaluation")
    print(f"{'='*60}")
    print(f"  AUC-ROC:          {auc:.4f}  (target > 0.70)")
    print(f"  Denial Recall:    {recall[0]:.4f}  (target > 0.30)")
    print(f"  Denial Precision: {precision[0]:.4f}  (target > 0.10)")
    print(f"  Denial F1:        {f1[0]:.4f}")
    print(f"  Approval Recall:  {recall[1]:.4f}")
    print(f"  Approval Prec:    {precision[1]:.4f}")
    print()
    print(f"  Confusion Matrix (rows=actual, cols=predicted):")
    print(f"              Pred=Denied  Pred=Approved")
    print(f"  Denied       {cm[0][0]:>8,}     {cm[0][1]:>8,}")
    print(f"  Approved     {cm[1][0]:>8,}     {cm[1][1]:>8,}")
    print()
    print(classification_report(y, y_pred, target_names=["Denied", "Approved"]))
    print(f"{'='*60}")

    return {
        "auc_roc": auc,
        "denial_recall": recall[0],
        "denial_precision": precision[0],
        "denial_f1": f1[0],
    }


def cross_validate(X_train, y_train, pipeline):
    """Run 5-fold stratified cross-validation and report results."""
    print("\nRunning 5-fold stratified cross-validation...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Get cross-validated predictions
    y_cv_proba = cross_val_predict(
        pipeline, X_train, y_train, cv=skf, method="predict_proba"
    )[:, 1]
    y_cv_pred = (y_cv_proba >= 0.5).astype(int)

    auc = roc_auc_score(y_train, y_cv_proba)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_train, y_cv_pred, labels=[0, 1], zero_division=0
    )

    print(f"  CV AUC-ROC:          {auc:.4f}")
    print(f"  CV Denial Recall:    {recall[0]:.4f}")
    print(f"  CV Denial Precision: {precision[0]:.4f}")

    return auc


def train():
    """Train the H1B approval prediction model."""
    # 1. Load data
    train_df, test_df = load_data()

    # 2. Prepare features
    print("\nPreparing features...")
    X_train, y_train = prepare_features(train_df)
    X_test, y_test = prepare_features(test_df)

    print(f"  X_train shape: {X_train.shape}")
    print(f"  X_test  shape: {X_test.shape}")
    print(f"  Train class distribution: approved={y_train.sum():,}, denied={(y_train == 0).sum():,}")
    print(f"  Test  class distribution: approved={y_test.sum():,}, denied={(y_test == 0).sum():,}")

    # 3. Build pipeline: StandardScaler + LogisticRegression
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(
            class_weight="balanced",
            solver="liblinear",
            random_state=42,
            max_iter=1000,
        )),
    ])

    # 4. Cross-validate
    cv_auc = cross_validate(X_train, y_train, pipeline)

    # 5. Train on full training set
    print("\nTraining on full training set (2021-2024)...")
    pipeline.fit(X_train, y_train)

    # 6. Evaluate on train set
    train_metrics = evaluate_model(pipeline, X_train, y_train, "Train")

    # 7. Evaluate on test set (2025)
    test_metrics = evaluate_model(pipeline, X_test, y_test, "Test (2025)")

    # 8. Check if targets are met
    print("\n--- Target Check ---")
    targets_met = True
    checks = [
        ("AUC-ROC > 0.70",      test_metrics["auc_roc"],          0.70),
        ("Denial Recall > 0.30", test_metrics["denial_recall"],    0.30),
        ("Denial Prec > 0.10",   test_metrics["denial_precision"], 0.10),
    ]
    for name, value, threshold in checks:
        status = "PASS" if value > threshold else "FAIL"
        if value <= threshold:
            targets_met = False
        print(f"  {status}: {name} = {value:.4f}")

    # 9. Feature importance (coefficients)
    clf = pipeline.named_steps["clf"]
    scaler = pipeline.named_steps["scaler"]
    print("\n--- Feature Coefficients (Logistic Regression) ---")
    coef_df = pd.DataFrame({
        "feature": FEATURE_COLS,
        "coefficient": clf.coef_[0],
        "abs_coef": np.abs(clf.coef_[0]),
    }).sort_values("abs_coef", ascending=False)
    for _, row in coef_df.iterrows():
        direction = "+" if row["coefficient"] > 0 else "-"
        print(f"  {direction} {row['feature']:30s}  coef={row['coefficient']:+.4f}")

    # 10. Save model
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / "h1b_model.joblib"
    joblib.dump(pipeline, model_path)
    print(f"\n[OK] Model saved to {model_path}")
    print(f"     File size: {model_path.stat().st_size / 1024:.1f} KB")

    # Save feature names for inference
    meta = {
        "feature_cols": FEATURE_COLS,
        "target_col": TARGET_COL,
        "train_years": [2021, 2022, 2023, 2024],
        "test_year": 2025,
        "excluded_year": 2026,
        "cv_auc_roc": cv_auc,
        "test_auc_roc": test_metrics["auc_roc"],
        "test_denial_recall": test_metrics["denial_recall"],
        "test_denial_precision": test_metrics["denial_precision"],
    }
    meta_path = MODEL_DIR / "model_meta.joblib"
    joblib.dump(meta, meta_path)
    print(f"[OK] Model metadata saved to {meta_path}")

    if not targets_met:
        print("\n[WARNING] Some targets not met. Consider trying XGBoost/LightGBM.")
    else:
        print("\n[OK] All metric targets met!")

    return pipeline, test_metrics


if __name__ == "__main__":
    train()
