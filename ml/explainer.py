"""
SHAP Explainability service for Vehicle Insurance & Loan Claim Fraud Detection.
Loads trained XGBoost model, Scikit-Learn preprocessor, and SHAP TreeExplainer.
Provides per-claim local SHAP breakdowns, feature contribution charts, and natural language explanations.
"""
import os
import joblib
import json
import numpy as np
import pandas as pd

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

class ClaimExplainer:
    def __init__(self):
        self.model_path = os.path.join(MODELS_DIR, "fraud_model.joblib")
        self.preprocessor_path = os.path.join(MODELS_DIR, "preprocessor.joblib")
        self.explainer_path = os.path.join(MODELS_DIR, "explainer.joblib")
        self.metadata_path = os.path.join(MODELS_DIR, "feature_metadata.json")

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}. Run ml/train.py first.")

        self.model = joblib.load(self.model_path)
        self.preprocessor = joblib.load(self.preprocessor_path)
        self.explainer = joblib.load(self.explainer_path)

        with open(self.metadata_path, "r") as f:
            metadata = json.load(f)
            self.numeric_features = metadata["numeric_features"]
            self.categorical_features = metadata["categorical_features"]
            self.all_feature_names = metadata["all_feature_names"]

        # Base value in probability space if log-odds
        try:
            expected_val = self.explainer.expected_value
            if isinstance(expected_val, (list, np.ndarray)):
                expected_val = expected_val[1] if len(expected_val) > 1 else expected_val[0]
            # convert log-odds to prob if raw margin
            self.base_value = float(1 / (1 + np.exp(-expected_val))) if abs(expected_val) > 1.5 else float(expected_val)
        except Exception:
            self.base_value = 0.50

    def _format_feature_label(self, feature_name: str, raw_value) -> str:
        """Translates encoded technical feature names into clear business terms."""
        clean_name = feature_name
        if "cat__" in clean_name:
            clean_name = clean_name.replace("cat__", "")
        if "num__" in clean_name:
            clean_name = clean_name.replace("num__", "")

        friendly_labels = {
            "PoliceReportFiled_No": "No Police Report Filed",
            "PoliceReportFiled_Yes": "Official Police Report Filed",
            "WitnessPresent_No": "No Independent Witnesses Present",
            "WitnessPresent_Yes": "Independent Witnesses Present",
            "Fault_Policy Holder": "At-Fault: Policy Holder",
            "Fault_Third Party": "At-Fault: Third Party",
            "PastNumberOfClaims_more than 4": "Frequent Claim History (>4 past claims)",
            "PastNumberOfClaims_2 to 4": "Multiple Past Claims (2-4)",
            "PastNumberOfClaims_none": "Clean Claims History (0 past claims)",
            "Days_Policy_Accident_none": "Accident on Policy Start Date",
            "Days_Policy_Accident_1 to 7": "Incident within 1-7 Days of Policy Inception",
            "Days_Policy_Accident_8 to 15": "Incident within 8-15 Days of Inception",
            "Days_Policy_Accident_more than 30": "Established Policy (>30 days before incident)",
            "AddressChange_Claim_under 6 months": "Address Changed <6 Months Before Claim",
            "AddressChange_Claim_1 year": "Address Changed 1 Year Before Claim",
            "AddressChange_Claim_no change": "Stable Residential Address",
            "DriverRating": "Driver Risk Rating Score",
            "ClaimAmount": "Total Claim Amount",
            "Age": "Claimant Age",
            "Deductible": "Policy Deductible Amount",
            "VehiclePrice": "Insured Vehicle Market Value",
            "AgentType_External": "External Broker Submission",
            "AgentType_Internal": "Direct / Internal Agent Submission"
        }

        for key, text in friendly_labels.items():
            if key in clean_name:
                return text

        # General prettifier
        return clean_name.replace("_", " ").title()

    def predict_and_explain(self, claim_data: dict) -> dict:
        """
        Accepts raw claim dictionary, returns:
        - fraud_score: float (0.0 to 1.0)
        - risk_tier: 'LOW' | 'MEDIUM' | 'HIGH'
        - base_value: model base baseline probability
        - top_factors: list of feature drivers with shap values, direction, and human labels
        - positive_factors: drivers pushing risk up
        - negative_factors: drivers pushing risk down
        - summary_rationale: plain-English explanation
        """
        # Ensure all expected columns exist
        df_row = {}
        for col in self.numeric_features:
            val = claim_data.get(col, 0)
            try:
                df_row[col] = float(val) if val is not None else 0.0
            except (ValueError, TypeError):
                df_row[col] = 0.0

        for col in self.categorical_features:
            val = claim_data.get(col, "Unknown")
            df_row[col] = str(val) if val is not None else "Unknown"

        single_df = pd.DataFrame([df_row])
        X_trans = self.preprocessor.transform(single_df)

        # Predict probability
        proba = float(self.model.predict_proba(X_trans)[0][1])
        fraud_score = round(proba, 4)

        if fraud_score >= 0.65:
            risk_tier = "HIGH"
        elif fraud_score >= 0.35:
            risk_tier = "MEDIUM"
        else:
            risk_tier = "LOW"

        # Compute SHAP values
        raw_shap = self.explainer.shap_values(X_trans)
        if isinstance(raw_shap, list):
            sample_shap = raw_shap[1][0] if len(raw_shap) > 1 else raw_shap[0][0]
        elif len(raw_shap.shape) == 3:
            sample_shap = raw_shap[0, :, 1]
        else:
            sample_shap = raw_shap[0]

        factors = []
        for i, (feat_name, shap_val) in enumerate(zip(self.all_feature_names, sample_shap)):
            # determine underlying raw value if numeric or matching categorical
            val_display = ""
            base_feature = feat_name.split("__")[-1]
            if base_feature in self.numeric_features:
                val_display = f"{df_row[base_feature]:,.0f}" if "Amount" in base_feature else str(df_row[base_feature])
            else:
                # categorical match
                for cat_col in self.categorical_features:
                    if cat_col in base_feature:
                        val_display = str(df_row.get(cat_col, ""))

            friendly_name = self._format_feature_label(feat_name, val_display)
            factors.append({
                "feature": feat_name,
                "display_name": friendly_name,
                "value": val_display,
                "shap_value": round(float(shap_val), 4),
                "direction": "RISK_INCREASING" if shap_val > 0 else "RISK_DECREASING",
                "abs_impact": abs(float(shap_val))
            })

        # Sort by absolute impact
        factors.sort(key=lambda x: x["abs_impact"], reverse=True)
        top_factors = factors[:12]

        positive_factors = [f for f in factors if f["shap_value"] > 0][:6]
        negative_factors = [f for f in factors if f["shap_value"] < 0][:6]

        # Synthesize plain-English rationale
        top_pos_names = [f"{f['display_name']} (+{f['shap_value']:.2f})" for f in positive_factors[:3]]
        top_neg_names = [f"{f['display_name']} ({f['shap_value']:.2f})" for f in negative_factors[:2]]

        if risk_tier == "HIGH":
            rationale = (
                f"Flagged as HIGH RISK ({fraud_score*100:.1f}%) primarily driven by: "
                + ", ".join(top_pos_names) + "."
            )
        elif risk_tier == "MEDIUM":
            rationale = (
                f"Flagged as MODERATE RISK ({fraud_score*100:.1f}%). Elevated risk indicators include "
                + ", ".join(top_pos_names) + ", offset by mitigating factors: "
                + ", ".join(top_neg_names) + "."
            )
        else:
            rationale = (
                f"Assessed as LOW RISK ({fraud_score*100:.1f}%). High confidence of legitimacy due to: "
                + ", ".join([f['display_name'] for f in negative_factors[:3]]) + "."
            )

        return {
            "fraud_score": fraud_score,
            "risk_tier": risk_tier,
            "base_value": round(self.base_value, 4),
            "top_factors": top_factors,
            "positive_factors": positive_factors,
            "negative_factors": negative_factors,
            "summary_rationale": rationale
        }

# Singleton instance
_explainer_instance = None

def get_explainer() -> ClaimExplainer:
    global _explainer_instance
    if _explainer_instance is None:
        _explainer_instance = ClaimExplainer()
    return _explainer_instance

if __name__ == '__main__':
    explainer = get_explainer()
    sample = {
        'Age': 24, 'Deductible': 400, 'DriverRating': 1, 'ClaimAmount': 34500,
        'WeekOfMonth': 2, 'WeekOfMonthClaimed': 2, 'Year': 2026,
        'Month': 'Jan', 'DayOfWeek': 'Monday', 'Make': 'BMW', 'AccidentArea': 'Urban',
        'Sex': 'Male', 'MaritalStatus': 'Single', 'Fault': 'Policy Holder',
        'PolicyType': 'Sport - All Perils', 'VehicleCategory': 'Sport',
        'VehiclePrice': 'more than 69000', 'Days_Policy_Accident': '1 to 7',
        'Days_Policy_Claim': '8 to 15', 'PastNumberOfClaims': '2 to 4',
        'AgeOfVehicle': 'new', 'AgeOfPolicyHolder': '21 to 25',
        'PoliceReportFiled': 'No', 'WitnessPresent': 'No', 'AgentType': 'External',
        'NumberOfSupplements': '3 to 5', 'AddressChange_Claim': 'under 6 months',
        'NumberOfCars': '1 vehicle', 'BasePolicy': 'All Perils'
    }
    result = explainer.predict_and_explain(sample)
    print("Test Claim Score:", result["fraud_score"], "Tier:", result["risk_tier"])
    print("Rationale:", result["summary_rationale"])
    print("Top 3 Risk Factors:")
    for f in result["top_factors"][:3]:
        print(f" - {f['display_name']}: {f['shap_value']}")
