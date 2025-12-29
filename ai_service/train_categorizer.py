import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import joblib
import os

# 1. Generate Synthetic Training Data
# In a real scenario, this would come from a labeled historical dataset.
data = [
    # Rent
    ("Monthly office rent payment", "rent"),
    ("Shop lease for December", "rent"),
    ("Warehouse rental fee", "rent"),
    ("Paid office space rent", "rent"),
    
    # Salaries
    ("Staff salaries for NOV", "salaries"),
    ("Monthly wages - marketing team", "salaries"),
    ("Employee payroll payment", "salaries"),
    ("Bonus payment to sales staff", "salaries"),
    
    # Stock
    ("Purchased inventory from supplier", "stock"),
    ("Restocking electronics stock", "stock"),
    ("Wholesaler payment for goods", "stock"),
    ("New products inventory order", "stock"),
    
    # Transport
    ("Fuel for delivery van", "transport"),
    ("Uber for business meeting", "transport"),
    ("Logistics and shipping fees", "transport"),
    ("Vehicle maintenance and petrol", "transport"),
    
    # Utilities
    ("Electricity bill - Main office", "utilities"),
    ("Water utility payment", "utilities"),
    ("Internet subscription fee", "utilities"),
    ("Phone and data charges", "utilities"),
    
    # Marketing
    ("Facebook ads campaign", "marketing"),
    ("Google search advertising", "marketing"),
    ("Printing flyers and banners", "marketing"),
    ("Social media promo costs", "marketing"),
]

# Expand data with some variation
df = pd.DataFrame(data, columns=['description', 'category'])

# 2. Build NLP Pipeline
# TfidfVectorizer converts text to numbers
# MultinomialNB is great for text classification
model = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english')),
    ('clf', MultinomialNB(alpha=0.1))
])

# 3. Train
print("Training Smart Categorizer model...")
model.fit(df['description'], df['category'])

# 4. Save
model_path = os.path.join(os.path.dirname(__file__), 'models')
if not os.path.exists(model_path):
    os.makedirs(model_path)

joblib.dump(model, os.path.join(model_path, 'categorizer.joblib'))
print(f"Model saved to {os.path.join(model_path, 'categorizer.joblib')}")

# 5. Quick Test
test_desc = ["Supplies for the shop"]
prediction = model.predict(test_desc)
print(f"Test prediction for '{test_desc[0]}': {prediction[0]}")
