"""
Model training pipeline for Vehicle Insurance Claim Fraud Detection.
Uses XGBoost classifier + Scikit-Learn preprocessing + SHAP TreeExplainer.
Evaluates precision, recall, F1, ROC-AUC, confusion matrix on held-out test data.
Saves model artifacts and performance metrics.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
import shap
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

PROCESSED_TRAIN_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "train.csv")
PROCESSED_TEST_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "test.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

NUMERIC_FEATURES = [
    'Age', 'Deductible', 'DriverRating', 'ClaimAmount',
    'WeekOfMonth', 'WeekOfMonthClaimed', 'Year'
]

CATEGORICAL_FEATURES = [
    'Month', 'DayOfWeek', 'Make', 'AccidentArea', 'Sex',
    'MaritalStatus', 'Fault', 'PolicyType', 'VehicleCategory',
    'VehiclePrice', 'Days_Policy_Accident', 'Days_Policy_Claim',
    'PastNumberOfClaims', 'AgeOfVehicle', 'AgeOfPolicyHolder',
    'PoliceReportFiled', 'WitnessPresent', 'AgentType',
    'NumberOfSupplements', 'AddressChange_Claim', 'NumberOfCars',
    'BasePolicy'
]

ID_COLS = ['ClaimID', 'ClaimantName', 'DayOfWeekClaimed', 'MonthClaimed']
TARGET_COL = 'FraudFound_P'

def train_model():
    os.makedirs(MODELS_DIR, exist_ok=True)

    print("Loading preprocessed training and testing data...")
    train_df = pd.read_csv(PROCESSED_TRAIN_PATH)
    test_df = pd.read_csv(PROCESSED_TEST_PATH)

    X_train_raw = train_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_train = train_df[TARGET_COL].values

    X_test_raw = test_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_test = test_df[TARGET_COL].values

    print(f"Features: {len(NUMERIC_FEATURES)} numeric, {len(CATEGORICAL_FEATURES)} categorical")
    print(f"Train samples: {len(X_train_raw)}, Positive fraud rate: {y_train.mean()*100:.2f}%")
    print(f"Test samples: {len(X_test_raw)}, Positive fraud rate: {y_test.mean()*100:.2f}%")

    # Build ColumnTransformer
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERIC_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )

    print("Fitting preprocessor on training data...")
    X_train_trans = preprocessor.fit_transform(X_train_raw)
    X_test_trans = preprocessor.transform(X_test_raw)

    # Extract feature names
    cat_encoder = preprocessor.named_transformers_['cat']
    encoded_cat_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    all_feature_names = NUMERIC_FEATURES + encoded_cat_names

    print(f"Total transformed features: {len(all_feature_names)}")

    # Calculate scale_pos_weight for XGBoost to balance classes
    pos_count = int(np.sum(y_train))
    neg_count = len(y_train) - pos_count
    scale_pos_weight = float(neg_count / max(pos_count, 1))

    print(f"Training XGBoost classifier (scale_pos_weight={scale_pos_weight:.2f})...")
    model = xgb.XGBClassifier(
        n_estimators=160,
        max_depth=4,
        learning_rate=0.07,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric='logloss'
    )

    model.fit(X_train_trans, y_train)

    # Evaluate on held-out test data
    y_pred_proba = model.predict_proba(X_test_trans)[:, 1]
    # Optimal classification threshold for fraud triage (e.g. 0.45-0.50)
    y_pred = (y_pred_proba >= 0.48).astype(int)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_test, y_pred_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n--- Test Set Evaluation Metrics ---")
    print(f"Accuracy:  {acc*100:.2f}%")
    print(f"Precision: {prec*100:.2f}%")
    print(f"Recall:    {rec*100:.2f}%")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {auc:.4f}")
    print(f"Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")

    # Build SHAP TreeExplainer
    print("\nBuilding SHAP TreeExplainer...")
    explainer = shap.TreeExplainer(model)

    # Compute global feature importance via SHAP on a representative sample of test set
    sample_size = min(300, len(X_test_trans))
    sample_X = X_test_trans[:sample_size]
    shap_vals = explainer.shap_values(sample_X)
    mean_abs_shap = np.mean(np.abs(shap_vals), axis=0)
    top_indices = np.argsort(mean_abs_shap)[::-1][:15]

    global_importances = []
    for idx in top_indices:
        global_importances.append({
            "feature": all_feature_names[idx],
            "importance": float(mean_abs_shap[idx])
        })

    # Save artifacts
    model_path = os.path.join(MODELS_DIR, "fraud_model.joblib")
    preprocessor_path = os.path.join(MODELS_DIR, "preprocessor.joblib")
    explainer_path = os.path.join(MODELS_DIR, "explainer.joblib")
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    metadata_path = os.path.join(MODELS_DIR, "feature_metadata.json")

    joblib.dump(model, model_path)
    joblib.dump(preprocessor, preprocessor_path)
    joblib.dump(explainer, explainer_path)

    metrics_payload = {
        "model_type": "XGBoost Classifier",
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "confusion_matrix": {
            "true_negative": cm[0][0],
            "false_positive": cm[0][1],
            "false_negative": cm[1][0],
            "true_positive": cm[1][1]
        },
        "test_samples": len(y_test),
        "train_samples": len(y_train),
        "global_feature_importance": global_importances
    }

    with open(metrics_path, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    metadata_payload = {
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "all_feature_names": all_feature_names
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata_payload, f, indent=2)

    print(f"\nAll models and metrics successfully saved to {MODELS_DIR}")
    return metrics_payload

if __name__ == '__main__':
    train_model()
