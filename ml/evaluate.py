"""
Model evaluation script.
Produces AUC-ROC, Denial Recall, Denial Precision metrics.
"""

import joblib
import pandas as pd
from pathlib import Path
from sklearn.metrics import roc_auc_score, classification_report, precision_recall_fscore_support

MODEL_DIR = Path(__file__).parent.parent / "backend" / "models"
DATA_DIR = Path(__file__).parent.parent / "data"


def evaluate():
    """Load saved model and evaluate on test set (2025 data)."""
    # TODO: Implement evaluation
    raise NotImplementedError("Evaluation not yet implemented")


if __name__ == "__main__":
    evaluate()
