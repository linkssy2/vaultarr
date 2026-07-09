from flask import Blueprint, render_template, request, redirect, session, url_for

from app.services.auth_service import auth_is_enabled, verify_credentials, load_auth_settings

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if not auth_is_enabled():
        return redirect(request.args.get("next") or "/")

    error = ""
    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        if verify_credentials(username, password):
            session.clear()
            session["vaultarr_user"] = username.strip()
            session.permanent = True
            return redirect(request.form.get("next") or request.args.get("next") or "/")
        error = "Invalid username or password."

    return render_template("login.html", error=error, next_url=request.args.get("next", "/"), auth_settings=load_auth_settings())


@auth_bp.route("/logout", methods=["POST", "GET"])
def logout():
    session.clear()
    return redirect(url_for("auth.login"))
