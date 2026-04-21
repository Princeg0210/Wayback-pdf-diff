from flask import Flask, request, render_template, jsonify
import fitz
import difflib
import re
import os

app = Flask(__name__)

def extract_text(pdf, max_pages=10):
    try:
        doc = fitz.open(stream=pdf.read(), filetype="pdf")
        text = []
        for i, page in enumerate(doc):
            if i >= max_pages:
                break
            content = page.get_text("text")
            if content:
                # clean but KEEP structure
                content = content.replace("\n", " ")
                content = " ".join(content.split())
                # split into sentences
                sentences = re.split(r'(?<=[.!?]) +', content)
                text.extend([s.strip() for s in sentences if s.strip()])
        return text
    except Exception as e:
        print(f"Error extracting text: {e}")
        return []

def word_diff(text1, text2):
    # We use make_file but we only want the table part to inject into our UI
    diff_html = difflib.HtmlDiff(wrapcolumn=40).make_table(text1, text2)
    return diff_html

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/compare", methods=["POST"])
def compare():
    if "file1" not in request.files or "file2" not in request.files:
        return jsonify({"error": "Please upload two PDF files"}), 400
    
    f1 = request.files["file1"]
    f2 = request.files["file2"]
    
    if f1.filename == "" or f2.filename == "":
        return jsonify({"error": "Empty file selection"}), 400

    t1 = extract_text(f1, max_pages=10)
    t2 = extract_text(f2, max_pages=10)

    if not t1 or not t2:
        return jsonify({"error": "Could not extract text from one or both PDFs"}), 400

    diff_table = word_diff(t1, t2)
    return jsonify({"diff": diff_table})

if __name__ == "__main__":
    app.run(debug=True, port=5001) # Using 5001 as 5000 is sometimes occupied on macOS