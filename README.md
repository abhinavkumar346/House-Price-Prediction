# 🏠 Bengaluru House Price Predictor

A full-stack machine learning web application that predicts residential property prices in Bengaluru, India. Built with a **scikit-learn Linear Regression model**, a **Flask REST API**, and a clean vanilla HTML/CSS/JS frontend.

---

## 📸 Preview
> ![App Screenshot](client/Screenshot 2026-03-01 190340.png)
> *Replace this placeholder with an actual screenshot of your running app.*

---

## 📁 Project Structure

```
HOUSE_PRICE_PREDICTION/
│
├── client/                  # Frontend (UI)
│   ├── app.html             # Main HTML page
│   ├── app.css              # Styles
│   └── app.js               # Frontend logic & API calls
│
├── model/                   # Jupyter notebook & raw data
│   ├── Bengaluru_House_Data.csv
│   ├── columns.json
│   └── Untitled.ipynb       # Model training notebook
│
└── server/                  # Flask backend
    ├── art/
    │   ├── columns.json     # Feature column names
    │   └── model.pickle     # Serialised trained model
    ├── server.py            # Flask routes
    └── utility.py           # Model loading & prediction logic
```

---

## 🔥 Complete Machine Learning Flow

```
Raw Data
   ↓
Remove Outliers
   ↓
Feature Engineering (One-Hot Encoding)
   ↓
Train Linear Regression Model
   ↓
Predict Price
   ↓
Visualize Results
```

---

## ⚙️ Function Explanations

### 1️⃣ Price Prediction — `predict_price()`

```python
def predict_price(location, sqft, bath, bhk):
    loc_index = np.where(X.columns == location)[0][0]

    x = np.zeros(len(X.columns))
    x[0] = sqft
    x[1] = bath
    x[2] = bhk

    if loc_index >= 0:
        x[loc_index] = 1

    return lr.predict([x])[0]
```

#### 🔹 Purpose
Predicts the price of a house based on:
- Location
- Square feet area
- Number of bathrooms
- Number of bedrooms (BHK)

It prepares the input in the format required by the trained Linear Regression model.

#### 🔹 Step-by-Step Explanation

**Step 1 — Find Location Index**

The model uses One-Hot Encoding for location. Example of columns:
```
['sqft', 'bath', 'bhk', 'Whitefield', 'Indira Nagar']
```
If `location = "Whitefield"`, its index is found using:
```python
np.where(X.columns == location)
```

**Step 2 — Create Zero Array**
```python
x = np.zeros(len(X.columns))
# → [0, 0, 0, 0, 0]
```

**Step 3 — Insert Basic Features**
```python
x[0] = sqft
x[1] = bath
x[2] = bhk
# → [1000, 2, 2, 0, 0]
```

**Step 4 — Apply One-Hot Encoding for Location**
```python
x[loc_index] = 1
# → [1000, 2, 2, 1, 0]   ← Only selected location is marked as 1
```

**Step 5 — Predict Price**
```python
lr.predict([x])[0]
# Model expects 2D array → [x]
# [0] extracts the predicted value
```

✅ **Final Output → Predicted House Price (in Lakhs)**

---

### 2️⃣ Outlier Removal — `remove_outliers()`

```python
def remove_outliers(df):
    df_out = pd.DataFrame()

    for location, subdf in df.groupby('location'):
        mean = np.mean(subdf.price_per_sqft)
        std  = np.std(subdf.price_per_sqft)

        reduced_df = subdf[
            (subdf.price_per_sqft > (mean - std)) &
            (subdf.price_per_sqft <= (mean + std))
        ]

        df_out = pd.concat([df_out, reduced_df], ignore_index=True)

    return df_out
```

#### 🔹 Purpose
Removes extreme price values from the dataset to improve model accuracy. Outliers negatively affect Linear Regression because the algorithm tries to fit a straight line through all points — including the bad ones.

#### 🔹 Step-by-Step Explanation

**Step 1 — Group Data by Location**
```python
df.groupby('location')
```
Each location is handled separately so comparisons are fair within the same neighbourhood.

**Step 2 — Calculate Mean and Standard Deviation**
```python
mean = np.mean(subdf.price_per_sqft)
std  = np.std(subdf.price_per_sqft)
# Example: Mean = 5000, Std = 500
```

**Step 3 — Keep Only the Valid Range**
```python
(mean - std) < price_per_sqft <= (mean + std)
# Example: 4500 < price_per_sqft <= 5500
```
All values outside this range are dropped.

**Step 4 — Combine Clean Data**

Cleaned data from each location is concatenated into a final DataFrame.

✅ **Result → Dataset without extreme values → Better model accuracy**

---

### 3️⃣ Scatter Plot — `plot_scatter_chart()`

```python
def plot_scatter_chart(df, location):
    bhk2 = df[(df.location == location) & (df.bhk == 2)]
    bhk3 = df[(df.location == location) & (df.bhk == 3)]

    plt.scatter(bhk2.total_sqft, bhk2.price_per_sqft, color='blue',
                label='2 BHK', s=50)
    plt.scatter(bhk3.total_sqft, bhk3.price_per_sqft, marker='+',
                color='green', label='3 BHK', s=50)

    plt.xlabel('Total Square Feet')
    plt.ylabel('Price per Square Feet')
    plt.title(location)
    plt.legend()
    plt.show()
```

#### 🔹 Purpose
Visualises the relationship between total square feet and price per square foot, comparing **2 BHK** and **3 BHK** houses for a given location.

#### 🔹 How It Works

| Marker | Meaning |
|--------|---------|
| 🔵 Blue dots | 2 BHK listings |
| 🟢 Green `+` | 3 BHK listings |
| X-axis | Total Square Feet |
| Y-axis | Price per Square Foot |

#### 🔹 Why This Is Important
Helps visually detect:
- Price trends across sizes
- Overlapping prices between BHK types (potential outliers)
- Abnormal or inconsistent values
- Overall data quality and distribution

---

## 🌐 REST API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health check |
| `GET`  | `/get_location` | Returns list of all known locations |
| `POST` | `/predict_price` | Accepts `total_sqft`, `bath`, `bhk`, `location` → returns predicted price |

---

## 💻 Frontend Features

- **Square footage input** with numeric validation
- **BHK & Bathroom steppers** (tap +/− to adjust, clamped 1–10)
- **Smart location field** — type to filter or pick from a dropdown of 240+ Bengaluru localities
- **Dynamic price formatting** — automatically displays in Thousands, Lakhs, or Crores based on the value
- Locations fetched live from the Flask server on page load

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- pip

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/house-price-prediction.git
cd house-price-prediction

# Install dependencies
pip install -r requirements.txt
```

### Run the Server

```bash
cd server
python server.py
```

The API will start at `http://127.0.0.1:5000`.

### Open the Frontend

Open `client/app.html` in your browser. No build step required.

---

## 📦 Requirements

```
numpy==1.26.4
pandas==2.2.2
matplotlib==3.8.4
scikit-learn==1.4.2
flask==3.0.3
pickle-mixin==1.0.2
```

Save this as `requirements.txt` in the root of your project.

---

## 🧠 What This Project Demonstrates

This is a complete beginner-to-intermediate ML workflow covering:

- ✅ Data Cleaning
- ✅ Feature Engineering (One-Hot Encoding)
- ✅ Statistical Outlier Filtering
- ✅ Model Training (Linear Regression)
- ✅ Model Prediction via REST API
- ✅ Data Visualization (Scatter Plots)
- ✅ Full-Stack Integration (Flask + Vanilla JS)

---
