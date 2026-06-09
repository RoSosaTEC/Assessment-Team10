# Assessment-Team10

Installation instructions (subject to change)

After cloning the repo:

### 2. Set up Python environment
```python3 -m venv venv```
```source venv/bin/activate```
```pip install pandas scikit-learn flask flask-cors joblib numpy```

### 3. Get the datasets (manual step — download from Kaggle)
### ISOT: https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset
### Place Fake.csv and True.csv in data/raw/

### 4. Clean and train
```python3 data_prep/clean_isot.py```
```python3 training/train_isot.py```

### 5. Install frontend dependencies
```cd frontend && npm install && cd ..```

### 6. Run the API
```cd api && python3 app.py```

### 7. Run the frontend
```cd frontend && npm run dev```
