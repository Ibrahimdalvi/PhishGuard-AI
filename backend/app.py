"""
PhishGuard AI - Flask Backend

Keeps the existing working scan pipeline:
ML + Domain Intelligence + Risk Engine + SSL + RDAP + SQLite + Gemini AI

Adds lightweight user authentication and per-user scan isolation
without requiring changes to the existing database.py API.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import hmac
import secrets
import sqlite3
from pathlib import Path

import joblib

from feature_extractor import extract_url_features
from domain_intelligence import get_domain_intelligence
from ssl_analyzer import analyze_ssl
from rdap_intelligence import lookup_rdap

from risk_engine import (
    compute_suspicious_signals,
    compute_risk_score,
    build_signal_summary,
)

from database import (
    initialize_database,
    save_scan,
    get_scan_history,
    delete_scan,
    clear_scan_history,
)

from ai_assistant import answer_chat


# =============================================================================
# APP
# =============================================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    },
    methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

initialize_database()

DB_PATH = Path(__file__).resolve().parent / "phishguard.db"


# =============================================================================
# MODEL
# =============================================================================

model_data = joblib.load(Path(__file__).resolve().parent / "phishing_model.pkl")

model = model_data["model"]
FEATURE_COLUMNS = model_data["features"]


# =============================================================================
# AUTH DATABASE
#
# This is added to the SAME phishguard.db file.
# Existing scan_history data is not deleted.
# =============================================================================

def auth_db():
    connection = sqlite3.connect(str(DB_PATH))
    connection.row_factory = sqlite3.Row
    return connection


def initialize_auth_tables():
    connection = auth_db()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS scan_owners (
                scan_id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        connection.commit()

    finally:
        connection.close()


initialize_auth_tables()


# =============================================================================
# PASSWORDS
# =============================================================================

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        200_000,
    )

    return (
        salt.hex()
        + ":"
        + derived.hex()
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split(":", 1)

        salt = bytes.fromhex(salt_hex)

        expected = bytes.fromhex(hash_hex)

        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            200_000,
        )

        return hmac.compare_digest(
            actual,
            expected,
        )

    except Exception:
        return False


# =============================================================================
# USER AUTH
# =============================================================================

def create_user(email: str, password: str) -> int:
    connection = auth_db()

    try:
        existing = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,),
        ).fetchone()

        if existing:
            raise ValueError(
                "An account with this email already exists."
            )

        cursor = connection.execute(
            """
            INSERT INTO users (
                email,
                password_hash
            )
            VALUES (?, ?)
            """,
            (
                email,
                hash_password(password),
            ),
        )

        connection.commit()

        return int(cursor.lastrowid)

    finally:
        connection.close()


def authenticate_user(email: str, password: str):
    connection = auth_db()

    try:
        row = connection.execute(
            """
            SELECT id, email, password_hash
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

        if not row:
            return None

        if not verify_password(
            password,
            row["password_hash"],
        ):
            return None

        return {
            "id": int(row["id"]),
            "email": row["email"],
        }

    finally:
        connection.close()


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(48)

    connection = auth_db()

    try:
        connection.execute(
            """
            INSERT INTO sessions (
                token,
                user_id
            )
            VALUES (?, ?)
            """,
            (
                token,
                user_id,
            ),
        )

        connection.commit()

        return token

    finally:
        connection.close()


def get_user_from_token(token: str):
    connection = auth_db()

    try:
        row = connection.execute(
            """
            SELECT
                users.id,
                users.email
            FROM sessions
            JOIN users
                ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()

        if not row:
            return None

        return {
            "id": int(row["id"]),
            "email": row["email"],
        }

    finally:
        connection.close()


def delete_session(token: str):
    connection = auth_db()

    try:
        connection.execute(
            "DELETE FROM sessions WHERE token = ?",
            (token,),
        )

        connection.commit()

    finally:
        connection.close()


def current_user():
    header = request.headers.get(
        "Authorization",
        "",
    ).strip()

    if not header.lower().startswith("bearer "):
        return None

    token = header[7:].strip()

    if not token:
        return None

    return get_user_from_token(token)


def require_user():
    return current_user()


# =============================================================================
# USER SCAN OWNERSHIP
# =============================================================================

def attach_scan_to_user(scan_id: int, user_id: int):
    connection = auth_db()

    try:
        connection.execute(
            """
            INSERT OR REPLACE INTO scan_owners (
                scan_id,
                user_id
            )
            VALUES (?, ?)
            """,
            (
                scan_id,
                user_id,
            ),
        )

        connection.commit()

    finally:
        connection.close()


def user_scan_ids(user_id: int):
    connection = auth_db()

    try:
        rows = connection.execute(
            """
            SELECT scan_id
            FROM scan_owners
            WHERE user_id = ?
            ORDER BY scan_id DESC
            """,
            (user_id,),
        ).fetchall()

        return {
            int(row["scan_id"])
            for row in rows
        }

    finally:
        connection.close()


def remove_scan_owner(scan_id: int):
    connection = auth_db()

    try:
        connection.execute(
            "DELETE FROM scan_owners WHERE scan_id = ?",
            (scan_id,),
        )

        connection.commit()

    finally:
        connection.close()


# =============================================================================
# HEALTH
# =============================================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "success",
        "message": "PhishGuard AI Backend is running",
        "version": "3.1.0-user-isolation",
    })


# =============================================================================
# REGISTER
# =============================================================================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    email = str(
        data.get("email", "")
    ).strip().lower()

    password = str(
        data.get("password", "")
    )

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required.",
        }), 400

    if len(password) < 6:
        return jsonify({
            "status": "error",
            "message": "Password must be at least 6 characters.",
        }), 400

    try:
        user_id = create_user(
            email,
            password,
        )

        return jsonify({
            "status": "success",
            "message": "Account created successfully.",
            "user": {
                "id": user_id,
                "email": email,
            },
        }), 201

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error),
        }), 409

    except Exception as error:
        print("Registration error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to create account.",
        }), 500


# =============================================================================
# LOGIN
# =============================================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = str(
        data.get("email", "")
    ).strip().lower()

    password = str(
        data.get("password", "")
    )

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required.",
        }), 400

    user = authenticate_user(
        email,
        password,
    )

    if not user:
        return jsonify({
            "status": "error",
            "message": "Invalid email or password.",
        }), 401

    try:
        token = create_session(
            user["id"],
        )

        return jsonify({
            "status": "success",
            "message": "Login successful.",
            "token": token,
            "user": user,
        }), 200

    except Exception as error:
        print("Login error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to create login session.",
        }), 500


# =============================================================================
# CURRENT USER
# =============================================================================

@app.route("/api/me", methods=["GET"])
def me():
    user = require_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Authentication required.",
        }), 401

    return jsonify({
        "status": "success",
        "user": user,
    }), 200


# =============================================================================
# LOGOUT
# =============================================================================

@app.route("/api/logout", methods=["POST"])
def logout():
    header = request.headers.get(
        "Authorization",
        "",
    ).strip()

    if header.lower().startswith("bearer "):
        token = header[7:].strip()

        if token:
            delete_session(token)

    return jsonify({
        "status": "success",
        "message": "Logged out successfully.",
    }), 200


# =============================================================================
# URL SCAN
# =============================================================================

@app.route("/api/scan", methods=["POST"])
def scan_url():
    user = require_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Authentication required.",
        }), 401

    data = request.get_json(silent=True) or {}

    url = str(
        data.get("url", "")
    ).strip()

    if not url:
        return jsonify({
            "status": "error",
            "message": "URL is required.",
        }), 400

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        # ---------------------------------------------------------------------
        # ML
        # ---------------------------------------------------------------------

        features = extract_url_features(url)

        feature_values = [
            features[column]
            for column in FEATURE_COLUMNS
        ]

        ml_prediction = model.predict(
            [feature_values]
        )[0]

        probabilities = model.predict_proba(
            [feature_values]
        )[0]

        classes = list(
            model.classes_
        )

        phishing_prob = float(
            probabilities[
                classes.index(0)
            ]
        )

        legitimate_prob = float(
            probabilities[
                classes.index(1)
            ]
        )

        # ---------------------------------------------------------------------
        # DOMAIN
        # ---------------------------------------------------------------------

        domain_intel = get_domain_intelligence(url)

        # ---------------------------------------------------------------------
        # RDAP
        # ---------------------------------------------------------------------

        rdap_info = lookup_rdap(
            domain_intel.get(
                "registrable_domain"
            )
        )

        # ---------------------------------------------------------------------
        # SSL
        # ---------------------------------------------------------------------

        ssl_analysis = analyze_ssl(url)

        # ---------------------------------------------------------------------
        # SIGNALS
        # ---------------------------------------------------------------------

        signals = compute_suspicious_signals(
            url,
            domain_intel,
        )

        signals["_ml_prob"] = phishing_prob

        # ---------------------------------------------------------------------
        # RISK
        # ---------------------------------------------------------------------

        result = compute_risk_score(
            ml_phishing_probability=phishing_prob,
            domain_intel=domain_intel,
            signals=signals,
            ssl_analysis=ssl_analysis,
        )

        final_risk_score = float(
            result["risk_score"]
        )

        verdict = result["verdict"]

        reasons = result["reasons"]

        signal_breakdown = result[
            "signal_breakdown"
        ]

        # ---------------------------------------------------------------------
        # SIGNAL SUMMARY
        # ---------------------------------------------------------------------

        signal_summary = build_signal_summary(
            signals,
            domain_intel,
            ssl_analysis,
        )

        # ---------------------------------------------------------------------
        # SAVE EXISTING SCAN RECORD
        # ---------------------------------------------------------------------

        scan_id = save_scan(
            user_id=user["id"],
            url=url,
            verdict=verdict,
            risk_score=final_risk_score,
            phishing_probability=round(
                phishing_prob * 100,
                2,
            ),
            legitimate_probability=round(
                legitimate_prob * 100,
                2,
            ),
            domain=(
                domain_intel.get("hostname")
                or domain_intel.get(
                    "registrable_domain"
                )
                or ""
            ),
        )

        return jsonify({
            "status": "success",
            "scan_id": scan_id,
            "user_id": user["id"],
            "url": url,
            "verdict": verdict,
            "risk_score": final_risk_score,
            "model_probability": round(
                phishing_prob * 100,
                2,
            ),
            "phishing_probability": round(
                phishing_prob * 100,
                2,
            ),
            "legitimate_probability": round(
                legitimate_prob * 100,
                2,
            ),
            "prediction": int(
                ml_prediction
            ),
            "domain_reputation": (
                "known_legitimate"
                if domain_intel.get(
                    "is_known_legitimate"
                )
                else "unknown"
            ),
            "domain_info": domain_intel,
            "rdap": rdap_info,
            "ssl_analysis": ssl_analysis,
            "signals": signal_summary,
            "score_breakdown": signal_breakdown,
            "reasons": reasons,
            "features": features,
        }), 200

    except Exception as error:
        print("Scan error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to analyze URL.",
            "error": str(error),
        }), 500


# =============================================================================
# USER HISTORY
# =============================================================================

@app.route("/api/history", methods=["GET"])
def history():
    user = require_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Authentication required.",
        }), 401

    try:
        scans = get_scan_history(
            user_id=user["id"],
            limit=100,
        )

        return jsonify({
            "status": "success",
            "scans": scans,
        }), 200

    except Exception as error:
        print("History error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to load scan history.",
            "error": str(error),
        }), 500


# =============================================================================
# DELETE ONE USER SCAN
# =============================================================================

@app.route("/api/history/<int:scan_id>", methods=["DELETE"])
def delete_history_item(scan_id):
    user = require_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Authentication required.",
        }), 401

    try:
        deleted = delete_scan(
            user_id=user["id"],
            scan_id=scan_id,
        )

        if not deleted:
            return jsonify({
                "status": "error",
                "message": "Scan not found.",
            }), 404

        return jsonify({
            "status": "success",
            "message": "Scan deleted successfully.",
        }), 200

    except Exception as error:
        print("Delete scan error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to delete scan.",
            "error": str(error),
        }), 500


# =============================================================================
# CLEAR ONE USER'S HISTORY
# =============================================================================

@app.route("/api/history", methods=["DELETE"])
def clear_history():
    user = require_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Authentication required.",
        }), 401

    try:
        deleted_count = clear_scan_history(
            user_id=user["id"],
        )

        return jsonify({
            "status": "success",
            "message": "Scan history cleared successfully.",
            "deleted_count": deleted_count,
        }), 200

    except Exception as error:
        print("Clear history error:", error)

        return jsonify({
            "status": "error",
            "message": "Unable to clear scan history.",
            "error": str(error),
        }), 500


# =============================================================================
# AI CHAT
# =============================================================================

@app.route("/api/chat", methods=["POST"])
def chat():
    user = require_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Authentication required.",
        }), 401

    data = request.get_json(silent=True) or {}

    message = str(
        data.get("message", "")
    ).strip()

    if not message:
        return jsonify({
            "status": "error",
            "message": "Message is required.",
        }), 400

    try:
        reply = answer_chat(
            message=message,
            history=data.get("history") or [],
            scan_context=data.get(
                "scan_context"
            ),
        )

        return jsonify({
            "status": "success",
            "reply": reply,
        }), 200

    except RuntimeError as error:
        return jsonify({
            "status": "error",
            "message": str(error),
        }), 503

    except Exception as error:
        print("AI chat error:", error)

        return jsonify({
            "status": "error",
            "message": "AI assistant is temporarily unavailable.",
        }), 500


# =============================================================================
# RUN
# =============================================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
