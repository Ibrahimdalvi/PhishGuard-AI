import os
import sqlite3
import secrets
from datetime import datetime, timezone

from werkzeug.security import generate_password_hash, check_password_hash


DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "phishguard.db"
)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    conn = get_connection()
    cursor = conn.cursor()

    # ---------------------------------------------------------
    # USERS
    # ---------------------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ---------------------------------------------------------
    # SESSIONS
    # ---------------------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ---------------------------------------------------------
    # SCAN HISTORY
    # ---------------------------------------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            url TEXT NOT NULL,
            verdict TEXT NOT NULL,
            risk_score REAL NOT NULL,
            phishing_probability REAL,
            legitimate_probability REAL,
            domain TEXT,
            scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ---------------------------------------------------------
    # MIGRATION FOR EXISTING DATABASES
    # ---------------------------------------------------------
    columns = cursor.execute(
        "PRAGMA table_info(scan_history)"
    ).fetchall()

    column_names = [column["name"] for column in columns]

    if "user_id" not in column_names:
        cursor.execute("""
            ALTER TABLE scan_history
            ADD COLUMN user_id INTEGER
        """)

    conn.commit()
    conn.close()


# =============================================================
# USER AUTHENTICATION
# =============================================================

def create_user(email, password):
    email = email.strip().lower()

    if not email or not password:
        raise ValueError("Email and password are required.")

    password_hash = generate_password_hash(password)

    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO users (email, password_hash)
            VALUES (?, ?)
        """, (email, password_hash))

        conn.commit()

        return cursor.lastrowid

    except sqlite3.IntegrityError:
        raise ValueError("An account with this email already exists.")

    finally:
        conn.close()


def authenticate_user(email, password):
    email = email.strip().lower()

    conn = get_connection()

    try:
        user = conn.execute("""
            SELECT id, email, password_hash
            FROM users
            WHERE email = ?
        """, (email,)).fetchone()

        if not user:
            return None

        if not check_password_hash(
            user["password_hash"],
            password
        ):
            return None

        return {
            "id": user["id"],
            "email": user["email"],
        }

    finally:
        conn.close()


def create_session(user_id):
    token = secrets.token_urlsafe(48)

    conn = get_connection()

    try:
        conn.execute("""
            INSERT INTO sessions (user_id, token)
            VALUES (?, ?)
        """, (user_id, token))

        conn.commit()

        return token

    finally:
        conn.close()


def get_user_from_token(token):
    if not token:
        return None

    conn = get_connection()

    try:
        user = conn.execute("""
            SELECT
                users.id,
                users.email
            FROM sessions
            INNER JOIN users
                ON users.id = sessions.user_id
            WHERE sessions.token = ?
        """, (token,)).fetchone()

        if not user:
            return None

        return {
            "id": user["id"],
            "email": user["email"],
        }

    finally:
        conn.close()


def delete_session(token):
    if not token:
        return

    conn = get_connection()

    try:
        conn.execute("""
            DELETE FROM sessions
            WHERE token = ?
        """, (token,))

        conn.commit()

    finally:
        conn.close()


# =============================================================
# SCAN HISTORY
# =============================================================

def save_scan(
    user_id,
    url,
    verdict,
    risk_score,
    phishing_probability=None,
    legitimate_probability=None,
    domain=None
):
    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO scan_history (
                user_id,
                url,
                verdict,
                risk_score,
                phishing_probability,
                legitimate_probability,
                domain
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            url,
            verdict,
            risk_score,
            phishing_probability,
            legitimate_probability,
            domain
        ))

        conn.commit()

        return cursor.lastrowid

    finally:
        conn.close()


def get_scan_history(user_id, limit=100):
    conn = get_connection()

    try:
        rows = conn.execute("""
            SELECT
                id,
                url,
                verdict,
                risk_score,
                phishing_probability,
                legitimate_probability,
                domain,
                scanned_at
            FROM scan_history
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT ?
        """, (user_id, limit)).fetchall()

        return [dict(row) for row in rows]

    finally:
        conn.close()


def delete_scan(user_id, scan_id):
    conn = get_connection()

    try:
        cursor = conn.execute("""
            DELETE FROM scan_history
            WHERE id = ?
            AND user_id = ?
        """, (scan_id, user_id))

        conn.commit()

        return cursor.rowcount > 0

    finally:
        conn.close()


def clear_scan_history(user_id):
    conn = get_connection()

    try:
        cursor = conn.execute("""
            DELETE FROM scan_history
            WHERE user_id = ?
        """, (user_id,))

        conn.commit()

        return cursor.rowcount

    finally:
        conn.close()