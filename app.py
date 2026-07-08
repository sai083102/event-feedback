import json
import os
import secrets
import threading
import uuid
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(32))

DASHBOARD_PASSWORD = os.environ.get("DASHBOARD_PASSWORD", "IEE2026")

RESPONSES_FILE = Path("responses.json")
MAX_RESPONSES = 2000
_responses_lock = threading.Lock()


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("authenticated"):
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized"}), 401
            return redirect(url_for("login", next=request.path))
        return view(*args, **kwargs)

    return wrapped


def load_responses():
    if not RESPONSES_FILE.exists():
        return []
    try:
        return json.loads(RESPONSES_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, IOError):
        return []


def save_responses(responses):
    RESPONSES_FILE.write_text(
        json.dumps(responses, indent=2, ensure_ascii=False), encoding="utf-8"
    )


@app.route("/")
def index():
    return redirect(url_for("pre_feedback"))


@app.route("/pre-feedback")
def pre_feedback():
    return render_template("pre_form.html")


@app.route("/post-feedback")
def post_feedback():
    return render_template("post_form.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        if request.form.get("password") == DASHBOARD_PASSWORD:
            session["authenticated"] = True
            return redirect(request.form.get("next") or url_for("dashboard"))
        error = "Incorrect password"
    return render_template("login.html", error=error, next=request.args.get("next", ""))


@app.route("/logout")
def logout():
    session.pop("authenticated", None)
    return redirect(url_for("pre_feedback"))


@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")


@app.route("/api/submit", methods=["POST"])
def submit():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No data received"}), 400

    with _responses_lock:
        responses = load_responses()
        if len(responses) >= MAX_RESPONSES:
            return jsonify({"error": "Response limit reached"}), 507

        entry = {
            "id": str(uuid.uuid4())[:8],
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            **data,
        }
        responses.append(entry)
        save_responses(responses)

    return jsonify({"success": True, "id": entry["id"]}), 201


@app.route("/api/responses")
@login_required
def get_responses():
    return jsonify(load_responses())


if __name__ == "__main__":
    app.run(debug=True, port=5000, threaded=True)
