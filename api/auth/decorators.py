from functools import wraps
import jwt

from flask import request, jsonify

from config.settings import settings
from database.pool import get_conn, release_conn


def token_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        if request.method == "OPTIONS":
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "error": "Token is missing"
            }), 401

        try:

            parts = auth_header.split()

            if len(parts) != 2 or parts[0].lower() != "bearer":
                return jsonify({
                    "error": "Invalid token format"
                }), 401

            token = parts[1]

            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=["HS256"]
            )

            conn = get_conn()

            try:
                cursor = conn.cursor()

                cursor.execute(
                    """
                    SELECT token_version
                    FROM users
                    WHERE id = %s
                    """,
                    (payload["user_id"],)
                )

                result = cursor.fetchone()

                cursor.close()

            finally:
                release_conn(conn)

            if not result:
                return jsonify({
                    "error": "User not found"
                }), 401

            if payload.get(
                "token_version",
                0
            ) != result[0]:

                return jsonify({
                    "error": "Token revoked"
                }), 401

            request.user = payload

        except Exception as e:

            print("AUTH ERROR:", e)

            return jsonify({
                "error": "Invalid token"
            }), 401

        return f(*args, **kwargs)

    return decorated