"""Authentication routes."""

import datetime

import bcrypt
import jwt
from flask import Blueprint, current_app, jsonify, request

from auth_utils import token_required
from db.queries import create_user, get_user_by_email, get_user_by_id, get_user_by_username, increment_user_token_version
from db.queries import create_user, get_user_by_email, get_user_by_username, get_user_by_id, increment_user_token_version

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    user = get_user_by_id(request.user["user_id"])

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
    })

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required."}), 400

    try:
        if get_user_by_username(username):
            return jsonify({"error": "Username already exists."}), 409

        if get_user_by_email(email):
            return jsonify({"error": "Email already exists."}), 409

        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user_id = create_user(username, email, password_hash)

        return jsonify({"message": "User registered successfully.", "user_id": user_id}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    user = get_user_by_username(username)
    if not user:
        return jsonify({"error": "Invalid username"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        return jsonify({"error": "Invalid password"}), 401

    token = jwt.encode(
        {
            "user_id": user["id"],
            "username": user["username"],
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
            "token_version": user["token_version"],
        },
        current_app.config["JWT_SECRET"],
        algorithm="HS256",
    )

    return jsonify({"token": token})


@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    user_id = request.user["user_id"]
    increment_user_token_version(user_id)
    return jsonify({"message": "Logged out"})