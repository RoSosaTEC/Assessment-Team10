from flask import Blueprint, jsonify

system_bp = Blueprint("system", __name__)

@system_bp.route("/", methods = ["GET"])

def health():
    return jsonify({
        "status":"ok",

        "message":"VerifyAI API running."
    })