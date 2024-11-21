from flask import Flask, request, jsonify, send_file, render_template
import os
from groq import Groq
import pandas as pd
import requests
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY="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"
if not GROQ_API_KEY:
    print("Error: API key is not properly loaded. Check your .env file.")

app = Flask(__name__)


UPLOAD_FOLDER = 'uploads'
RESULT_FOLDER = 'downloads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULT_FOLDER'] = RESULT_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'File not uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    try:
        data = pd.read_csv(filepath)
        return jsonify({'columns': data.columns.tolist(), 'preview': data.head().to_dict(orient='records')})
    except Exception as e:
        return jsonify({'error': f"Failed to read file: {e}"}), 400


@app.route('/upload2', methods=['POST'])
def process_google_drive_upload():
    data = request.get_json()
    google_drive_link = data.get('sheet_url')
    if not google_drive_link:
        return jsonify({"error": "Google Drive link is required"}), 400

    # Extract Google Sheets ID
    try:
        sheet_id = google_drive_link.split('/d/')[1].split('/')[0]
        sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
        response = requests.get(sheet_url)

        if response.status_code == 200:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'google_sheet_data.csv')
            with open(file_path, 'wb') as f:
                f.write(response.content)
            df = pd.read_csv(file_path)

            # Return columns and preview data
            return jsonify({
                'columns': df.columns.tolist(),
                'preview': df.head().to_dict(orient='records')
            })
        else:
            return jsonify({"error": "Failed to download CSV from Google Drive"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/process-query', methods=['POST'])
def process_query():
    data = request.json
    prompt = data.get('prompt')
    input_type = data.get('input_type')
    entities = []

    if not prompt:
        return jsonify({"status": "error", "message": "No query provided"}), 400
    try:
        if input_type == 'csv':
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], data.get('file_name'))
            if not os.path.isfile(file_path):
                return jsonify({"status": "error", "message": "File not found"}), 404
            df = pd.read_csv(file_path)
            column = data.get('selected_column')
            if column not in df.columns:
                return jsonify({"status": "error", "message": f"Column '{column}' not found in file"}), 400
            entities = df[column].tolist()

        elif input_type == 'google_drive_link':
            drive_link = data.get('google_drive_link')
            try:
                sheet_id = drive_link.split('/d/')[1].split('/')[0]
                sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
                df = pd.read_csv('uploads/google_sheet_data.csv')
                column = data.get('selected_column')
                if column not in df.columns:
                    return jsonify({"status": "error", "message": f"Column '{column}' not found in Google Sheet"}), 400
                entities = df[column].tolist()
            except Exception as e:
                return jsonify({"status": "error", "message": f"Failed to process Google Drive link: {e}"}), 400
        else:
            return jsonify({"status": "error", "message": "Invalid input type"}), 400

        client = Groq(api_key="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")
        results = []
        for entity in entities:
            query = prompt.replace("{entity}", entity)
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": query},{
            "role": "system",
            "content": "Respond with concise, specific answers only. Do not elaborate.Try one word answers.",
            }],
            model="llama3-8b-8192",
            max_tokens=25,
            )
            processed_data = chat_completion.choices[0].message.content
            results.append({'entity': entity, 'data': processed_data})
        result_file = os.path.join(app.config['RESULT_FOLDER'], 'results.csv')
        pd.DataFrame(results).to_csv(result_file, index=False)
        return jsonify({'results': results, 'download_link': '/download-results'})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Processing failed: {e}"}), 500


@app.route('/download-results', methods=['GET'])
def download_results():
    result_file = os.path.join(app.config['RESULT_FOLDER'], 'results.csv')
    if os.path.isfile(result_file):
        return send_file(result_file, as_attachment=True, download_name="results.csv")
    return jsonify({'error': 'Results file not found'}), 404


if __name__ == '__main__':
    app.run(debug=True)
    