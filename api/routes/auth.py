from flask import (Blueprint, jsonify, request,)
import bcrypt
import logging

logging.basicConfig(
    filename='/var/log/flask/app.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)

from auth.decorators import (token_required)
from auth.jwt_handler import (generate_token)
from repositories.users import (create_user, get_user_by_username, username_exists, email_exists, increment_token_version,)
from repositories.history import (get_history)

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({
            "error": "Username, email, and password are required."
        }), 400
    

    try:
        if username_exists(username):
            return jsonify({
                "error": "Username already exists"
            }), 409

        if email_exists(email):
            return jsonify({
                "error": "Mail already exists"
            }), 409

        password_hash = bcrypt.hashpw(
            password.encode(),
            bcrypt.gensalt()
        ).decode()

        user_id = create_user(
            username,
            email,
            password_hash
        )

        logging.info(
            f"El usuario {username} con id {user_id} creo una cuenta de forma exitosa"
        )

        return jsonify({
            "message": "User registered successfully.",
            "user_id": user_id
        }), 201

    except Exception as e:
        logging.error(
            f"Error: {str(e)}"
        )
        return jsonify({
            "error": str(e)
        }), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400


    user = get_user_by_username(username)

    if not user:
        return jsonify({"error": "Invalid username"}), 401
    

    stored_hash = user[2]

    if not bcrypt.checkpw(password.encode(), stored_hash.encode()):
        return jsonify({"error": "Invalid password"}), 401

    token = generate_token(user)

    logging.info(
            f"El usuario {username} inicio sesion"
        )

    return jsonify({"token": token})

@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    logging.info(
            f"El usuario {user_id} termino sesion"
        )
    user_id = request.user["user_id"]
    increment_token_version(
        request.user["user_id"]
        )
    return jsonify({
        "message": "Logged out"
        })

@auth_bp.route("/history", methods=["GET"])
@token_required
def history():
    user_id = request.user.get("user_id")

    limit = request.args.get("limit", 20, type=int)
    offset = request.args.get("offset", 0, type=int)

    try:
        rows = get_history(
            user_id,
            limit,
            offset,
        )

        return jsonify({
            "history": rows,
            "limit": limit,
            "offset": offset,
        })
    except Exception as e:
        logging.error(
            f"Error {str(e)}"
        )
        return jsonify({"error": str(e)}), 500

    