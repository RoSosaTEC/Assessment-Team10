# Project Local Setup Instructions
<div align="center">
  <samp>
    <a href="##1-clone-the-repository">Clone Repo</a> • 
    <a href="#2-database-installation-postgresql">Database</a> • 
    <a href="#3-create-database-and-user-in-postgresql">DB Users</a> • 
    <a href="#5-python-virtual-environment-setup">Python Env</a> • 
    <a href="#6-download-datasets-manual-step">Datasets</a> • 
    <a href="#9-system-execution-workflow">Execution</a>
  </samp>
</div>

<br>

> [!WARNING]
> For local only
> Make sure to follow the steps in the exact order indicated to prevent dependency conflicts, missing database schemas, or unresolved paths during development.

---

## 1. Clone the Repository

Before starting, clone the project repository to your local machine and move into the root directory:


```sh
git clone [https://github.com/tu-usuario/Assessment-Team10.git](https://github.com/tu-usuario/Assessment-Team10.git)
cd Assessment-Team10
```

---

## 2. Database Installation (PostgreSQL)

The system requires a local, active instance of PostgreSQL for managing user persistence, sessions, and analytical records.

### Windows (PowerShell)

Install PostgreSQL using the official Windows Package Manager:

```powershell
winget install PostgreSQL.PostgreSQL
```

### Linux (Fedora / RedHat)

```sh
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

### macOS

```sh
brew install postgresql@14
brew services start postgresql@14
```

---

## 3. Create Database and User in PostgreSQL

Once the installation is complete, you must initialize the backend environment in Postgres. Open your terminal or PowerShell and launch the interactive client:

1. **Access as administrator (postgres):**
```powershell
& "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe" -U postgres
```

*(Enter the master password you defined during the installation wizard).*

2. **Create the dedicated user role with login permissions:**
```sql
CREATE ROLE verifyai_user LOGIN PASSWORD 'verifyai_pass';
```

3. **Create the database and assign the user as the owner:**
```sql
CREATE DATABASE verifyai OWNER verifyai_user;
```


4. **Exit the interactive PostgreSQL client safely:**
```sql
\\q
```

> [!IMPORTANT]
> **WINDOWS USER WARNING:** If you make a syntax error and type an unclosed quote (e.g., `;'`), the prompt will change to `postgres'#` indicating an open string block. If you get stuck there, press `Ctrl + C` to force-quit back to PowerShell.

---

## 4. Environment File Configuration (.env)
Navigate to the API folder and create a configuration file named `.env` to map the credentials you just registered:
```sh
cd api
# Create the .env file with the following contents:

```
Add these exact environment variables inside `api/.env`:

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=verifyai
DB_USER=verifyai_user
DB_PASSWORD=verifyai_pass

```

---

## 5. Python Virtual Environment Setup

Return to the root of your project and install the environment to isolate the backend dependencies.

> [!NOTE]
> All necessary core libraries (such as Flask, Flask-CORS, Groq, joblib, etc.) are already packed inside the API's `requirements.txt` file.

###  Linux / macOS

```sh
python3 -m venv venv
source venv/bin/activate
cd api
pip install -r requirements.txt
cd ..

```

### Windows (PowerShell)

```powershell
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
cd api
pip install -r requirements.txt
cd ..

```
---

##  6. Download Datasets (Manual Step)

The core Machine Learning model processes and trains using the ISOT dataset.

1. Download the official dataset directly from Kaggle: 

`https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset`
2. Extract the downloaded zip file.
3. Move `Fake.csv` and `True.csv` exactly into the following structured directory relative to the project root:
```text
data/raw/
```
---

## 7. Data Preprocessing & Training

Once the CSV files are in place, run the architecture scripts sequentially from the root of the repository to process the data and train the final predictive model:

### Linux / macOS

```sh
python3 data_prep/clean_isot.py
python3 training/train_isot.py
```

### Windows (PowerShell)

```powershell
python data_prep/clean_isot.py
python training/train_isot.py
```

---

## 8. Frontend Module Installation

To initialize the web graphical interface ecosystem, navigate to the frontend folder and install its Node.js package dependencies:

```sh
cd frontend
npm install
cd ..
```

---

## 9. System Execution Workflow

All set! With the infrastructure fully configured, open two separate terminals positioned at the project root to start the services:

### Terminal 1: Launch Backend Server (API)
*(Remember to activate your virtual environment before starting the script).*
```sh
cd api
python app.py
```

### Terminal 2: Launch Web Application (Frontend)
```sh
cd frontend
npm run dev
```
