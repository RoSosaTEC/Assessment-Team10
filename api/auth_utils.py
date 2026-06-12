"""Authentication helpers for Flask routes."""

from functools import wraps

import jwt
from flask import current_app, jsonify, request

from db.queries import get_user_token_version


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Token is missing"}), 401

        try:
            token_parts = auth_header.split()
            if len(token_parts) != 2 or token_parts[0].lower() != "bearer":
                return jsonify({"error": "Invalid token format"}), 401

            payload = jwt.decode(
                token_parts[1],
                current_app.config["JWT_SECRET"],
                algorithms=["HS256"],
            )
            token_version = get_user_token_version(payload["user_id"])

            if token_version is None:
                return jsonify({"error": "User not found"}), 401

            if payload.get("token_version", 0) != token_version:
                return jsonify({"error": "Token has been revoked"}), 401

            request.user = payload
        except Exception as exc:
            print("AUTH ERROR:", exc)
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated