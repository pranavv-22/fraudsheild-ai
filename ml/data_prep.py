"""
Data preparation script for Vehicle Insurance / Loan Claim Fraud Detection.
Uses Kaggle Vehicle Insurance Claim Fraud schema (fraud_oracle) with realistic fraud risk patterns.
Generates training, testing, and sample upload datasets.
"""
import os
import random
import numpy as np
import pandas as pd

RAW_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "vehicle_fraud_dataset.csv")
PROCESSED_TRAIN_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "train.csv")
PROCESSED_TEST_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "test.csv")
SAMPLE_UPLOAD_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "sample_claims_upload.csv")

FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
    "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
    "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon",
    "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
    "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna",
    "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma",
    "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Alexander", "Debra",
    "Frank", "Rachel", "Patrick", "Catherine", "Raymond", "Carolyn", "Jack", "Janet",
    "Dennis", "Ruth", "Jerry", "Maria", "Tyler", "Heather", "Aaron", "Diane"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
    "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
    "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
    "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
    "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers"
]

def generate_synthetic_kaggle_dataset(n_samples: int = 3000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    random.seed(seed)

    records = []
    
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    makes = ['Honda', 'Toyota', 'Ford', 'Mazda', 'Chevrolet', 'Pontiac', 'Accura', 'Dodge', 'BMW', 'Audi', 'Nissan']
    marital_statuses = ['Single', 'Married', 'Divorced', 'Widow']
    policy_types = [
        'Sedan - All Perils', 'Sedan - Collision', 'Sedan - Liability',
        'Sport - All Perils', 'Sport - Collision', 'Sport - Liability',
        'Utility - All Perils', 'Utility - Collision', 'Utility - Liability'
    ]
    vehicle_categories = ['Sedan', 'Sport', 'Utility']
    vehicle_prices = ['less than 20000', '20000 to 29000', '30000 to 39000', '40000 to 59000', '60000 to 69000', 'more than 69000']
    past_claims_opts = ['none', '1', '2 to 4', 'more than 4']
    vehicle_ages = ['new', '2 years', '3 years', '4 years', '5 years', '6 years', '7 years', 'more than 7']
    policy_holder_ages = ['18 to 20', '21 to 25', '26 to 30', '31 to 35', '36 to 40', '41 to 50', '51 to 65', 'over 65']
    days_policy_accident = ['none', '1 to 7', '8 to 15', '15 to 30', 'more than 30']
    address_changes = ['no change', 'under 6 months', '1 year', '2 to 3 years', '4 to 8 years']
    num_cars = ['1 vehicle', '2 vehicles', '3 to 4', '5 to 8', 'more than 8']
    num_supplements = ['none', '1 to 2', '3 to 5', 'more than 5']

    for i in range(1, n_samples + 1):
        claim_id = f"CLM-{2026000 + i}"
        claimant_name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        
        month = random.choice(months)
        week_of_month = random.randint(1, 5)
        day_of_week = random.choice(days)
        make = random.choice(makes)
        accident_area = np.random.choice(['Urban', 'Rural'], p=[0.85, 0.15])
        day_claimed = random.choice(days)
        month_claimed = random.choice(months)
        week_claimed = random.randint(1, 5)
        sex = np.random.choice(['Male', 'Female'], p=[0.75, 0.25])
        marital_status = np.random.choice(marital_statuses, p=[0.30, 0.55, 0.12, 0.03])
        age = int(np.clip(np.random.normal(40, 14), 18, 75))
        fault = np.random.choice(['Policy Holder', 'Third Party'], p=[0.65, 0.35])
        policy_type = random.choice(policy_types)
        vehicle_category = policy_type.split(' - ')[0]
        vehicle_price = np.random.choice(vehicle_prices, p=[0.15, 0.30, 0.25, 0.18, 0.07, 0.05])
        deductible = int(np.random.choice([300, 400, 500, 700], p=[0.10, 0.65, 0.20, 0.05]))
        driver_rating = int(np.random.choice([1, 2, 3, 4], p=[0.20, 0.30, 0.30, 0.20]))
        days_pol_acc = np.random.choice(days_policy_accident, p=[0.05, 0.08, 0.12, 0.25, 0.50])
        days_pol_claim = np.random.choice(['8 to 15', '15 to 30', 'more than 30'], p=[0.15, 0.35, 0.50])
        past_claims = np.random.choice(past_claims_opts, p=[0.45, 0.30, 0.20, 0.05])
        age_vehicle = random.choice(vehicle_ages)
        age_pol_holder = random.choice(policy_holder_ages)
        police_report = np.random.choice(['No', 'Yes'], p=[0.88, 0.12])
        witness_present = np.random.choice(['No', 'Yes'], p=[0.92, 0.08])
        agent_type = np.random.choice(['External', 'Internal'], p=[0.85, 0.15])
        supplements = np.random.choice(num_supplements, p=[0.45, 0.30, 0.18, 0.07])
        address_change = np.random.choice(address_changes, p=[0.65, 0.12, 0.13, 0.07, 0.03])
        cars = np.random.choice(num_cars, p=[0.70, 0.20, 0.07, 0.02, 0.01])
        year = random.choice([2024, 2025, 2026])
        base_policy = policy_type.split(' - ')[1]

        # Calculate realistic Claim Amount
        base_amt = 4000
        if vehicle_category == 'Sport':
            base_amt += 9000
        elif vehicle_category == 'Utility':
            base_amt += 5000
        if 'more than' in vehicle_price or '60000' in vehicle_price:
            base_amt += 12000
        elif '40000' in vehicle_price:
            base_amt += 6000
        
        claim_amount = round(float(np.clip(np.random.normal(base_amt, 4500), 1200, 65000)), 2)

        # Realistic fraud risk modeling score calculation with strong clinical & empirical patterns
        fraud_risk_score = -1.2  # baseline bias
        if police_report == 'No':
            fraud_risk_score += 0.85
        else:
            fraud_risk_score -= 0.60

        if witness_present == 'No':
            fraud_risk_score += 0.40
        else:
            fraud_risk_score -= 0.70

        if fault == 'Policy Holder':
            fraud_risk_score += 0.95
        else:
            fraud_risk_score -= 0.80

        if past_claims == 'more than 4':
            fraud_risk_score += 1.10
        elif past_claims == '2 to 4':
            fraud_risk_score += 0.65
        elif past_claims == 'none':
            fraud_risk_score -= 0.50

        if days_pol_acc in ['none', '1 to 7']:
            fraud_risk_score += 1.20
        elif days_pol_acc == '8 to 15':
            fraud_risk_score += 0.60
        elif days_pol_acc == 'more than 30':
            fraud_risk_score -= 0.40

        if address_change in ['under 6 months', '1 year']:
            fraud_risk_score += 0.75
        elif address_change == 'no change':
            fraud_risk_score -= 0.30

        if driver_rating in [1, 2]:
            fraud_risk_score += 0.55
        elif driver_rating == 4:
            fraud_risk_score -= 0.35

        if vehicle_category == 'Sport' and 'All Perils' in policy_type:
            fraud_risk_score += 0.70

        if claim_amount > 20000:
            fraud_risk_score += 0.80
        elif claim_amount < 5000:
            fraud_risk_score -= 0.45

        if agent_type == 'External':
            fraud_risk_score += 0.35

        if supplements in ['3 to 5', 'more than 5']:
            fraud_risk_score += 0.60

        # Calibrated Sigmoid probability
        prob = 1.0 / (1.0 + np.exp(-fraud_risk_score))
        fraud_found = 1 if prob >= 0.52 else 0
        # Add slight natural real-world noise (4%)
        if np.random.rand() < 0.04:
            fraud_found = 1 - fraud_found

        records.append({
            'ClaimID': claim_id,
            'ClaimantName': claimant_name,
            'Month': month,
            'WeekOfMonth': week_of_month,
            'DayOfWeek': day_of_week,
            'Make': make,
            'AccidentArea': accident_area,
            'DayOfWeekClaimed': day_claimed,
            'MonthClaimed': month_claimed,
            'WeekOfMonthClaimed': week_claimed,
            'Sex': sex,
            'MaritalStatus': marital_status,
            'Age': age,
            'Fault': fault,
            'PolicyType': policy_type,
            'VehicleCategory': vehicle_category,
            'VehiclePrice': vehicle_price,
            'Deductible': deductible,
            'DriverRating': driver_rating,
            'Days_Policy_Accident': days_pol_acc,
            'Days_Policy_Claim': days_pol_claim,
            'PastNumberOfClaims': past_claims,
            'AgeOfVehicle': age_vehicle,
            'AgeOfPolicyHolder': age_pol_holder,
            'PoliceReportFiled': police_report,
            'WitnessPresent': witness_present,
            'AgentType': agent_type,
            'NumberOfSupplements': supplements,
            'AddressChange_Claim': address_change,
            'NumberOfCars': cars,
            'Year': year,
            'BasePolicy': base_policy,
            'ClaimAmount': claim_amount,
            'FraudFound_P': fraud_found
        })

    return pd.DataFrame(records)


def prepare_data():
    os.makedirs(os.path.dirname(RAW_DATA_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(PROCESSED_TRAIN_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(SAMPLE_UPLOAD_PATH), exist_ok=True)

    print("Generating comprehensive Kaggle Vehicle Insurance Fraud dataset...")
    df = generate_synthetic_kaggle_dataset(n_samples=3200, seed=42)
    df.to_csv(RAW_DATA_PATH, index=False)
    print(f"Saved raw dataset to {RAW_DATA_PATH} ({len(df)} rows, {df['FraudFound_P'].mean()*100:.1f}% fraud rate)")

    # Stratified Train/Test Split (80/20)
    fraud_df = df[df['FraudFound_P'] == 1]
    non_fraud_df = df[df['FraudFound_P'] == 0]

    train_fraud = fraud_df.sample(frac=0.8, random_state=42)
    test_fraud = fraud_df.drop(train_fraud.index)

    train_non_fraud = non_fraud_df.sample(frac=0.8, random_state=42)
    test_non_fraud = non_fraud_df.drop(train_non_fraud.index)

    train_df = pd.concat([train_fraud, train_non_fraud]).sample(frac=1.0, random_state=42).reset_index(drop=True)
    test_df = pd.concat([test_fraud, test_non_fraud]).sample(frac=1.0, random_state=42).reset_index(drop=True)

    train_df.to_csv(PROCESSED_TRAIN_PATH, index=False)
    test_df.to_csv(PROCESSED_TEST_PATH, index=False)
    print(f"Saved train set: {len(train_df)} rows, test set: {len(test_df)} rows")

    # Generate sample upload CSV (35 fresh claims without FraudFound_P for dashboard testing)
    sample_upload_df = generate_synthetic_kaggle_dataset(n_samples=35, seed=101)
    # Drop the ground truth column so it represents real unclassified incoming claims
    sample_upload_df = sample_upload_df.drop(columns=['FraudFound_P'])
    sample_upload_df.to_csv(SAMPLE_UPLOAD_PATH, index=False)
    print(f"Saved sample upload claims to {SAMPLE_UPLOAD_PATH} (35 claims ready for user upload)")


if __name__ == '__main__':
    prepare_data()
