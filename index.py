from flask import Flask, request, jsonify, render_template, redirect, url_for
import requests
import os
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)

# Apply ProxyFix for proper header handling on Vercel
app.wsgi_app = ProxyFix(app.wsgi_app)

COOKIE_FILE = 'cookie.txt'
ADMIN_PASSWORD = 'admin'  # Change this to a strong password

# Utility function to read the current cookie
def get_cookie():
    try:
        with open(COOKIE_FILE, 'r') as file:
            return file.read().strip()
    except FileNotFoundError:
        return None

# Utility function to save a new cookie
def save_cookie(cookie):
    with open(COOKIE_FILE, 'w') as file:
        file.write(cookie.strip())

# Route to display the cookie management dashboard
@app.route('/manage-cookie', methods=['GET', 'POST'])
def manage_cookie():
    if request.method == 'POST':
        password = request.form.get('password')
        if password != ADMIN_PASSWORD:
            return "Unauthorized", 403

        # Handle adding a new cookie
        if 'new_cookie' in request.form:
            new_cookie = request.form.get('new_cookie')
            if new_cookie:
                save_cookie(new_cookie)
                return redirect(url_for('manage_cookie'))
        
        # Handle deleting the current cookie
        elif 'delete_cookie' in request.form:
            if os.path.exists(COOKIE_FILE):
                os.remove(COOKIE_FILE)
            return redirect(url_for('manage_cookie'))
    
    # Display the current cookie and form
    current_cookie = get_cookie()
    return render_template('cookie_manager.html', current_cookie=current_cookie)

# Route for the main API call
@app.route('/api', methods=['GET'])
def call_api():
    phone_number = request.args.get('number')
    if not phone_number:
        return jsonify({"error": "Phone number is required", "Dev": "pikachufrombd.t.me"}), 400

    cookie = get_cookie()
    if not cookie:
        return jsonify({"error": "No cookie found. Please add a cookie first.", "Dev": "pikachufrombd.t.me"}), 400

    url = f'https://channel.mynagad.com:20010/api/customer/detail/{phone_number}'
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'sec-ch-ua-platform': '"Android"',
        'sec-ch-ua': '"Chromium";v="130", "Android WebView";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'X-Requested-With': 'mark.via.gp',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://channel.mynagad.com:20010/ui/dms/',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Cookie': cookie
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timed out", "Dev": "pikachufrombd.t.me"}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Request failed: {str(e)}", "Dev": "pikachufrombd.t.me"}), 500

    try:
        # Attempt to parse JSON response
        result = response.json()
        result["Dev"] = "pikachufrombd.t.me"
        return jsonify(result)
    except ValueError:
        # If response is not JSON (possibly due to an expired cookie), return HTML message
        return render_template("cookie_expired.html"), 502

# Vercel entry point
def handler(event, context):
    from werkzeug.serving import run_simple
    run_simple('0.0.0.0', 5000, app)
    
