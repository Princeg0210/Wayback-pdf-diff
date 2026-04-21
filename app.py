import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from flask import Flask, request, render_template, jsonify
import fitz
import difflib
import re
import os
import io

app = Flask(__name__)

# Configure a requests session with retries for the Wayback API
wayback_session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
wayback_session.mount("https://", HTTPAdapter(max_retries=retries))

def extract_text(pdf_data, max_pages=10):
    try:
        # Handle both file-like objects and bytes
        if hasattr(pdf_data, 'read'):
            stream = pdf_data.read()
        else:
            stream = pdf_data
            
        doc = fitz.open(stream=stream, filetype="pdf")
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
        doc.close()
        return text
    except Exception as e:
        print(f"Error extracting text: {e}")
        return []

def word_diff(text1, text2):
    # Get stats first
    s = difflib.SequenceMatcher(None, text1, text2)
    stats = {"add": 0, "del": 0, "chg": 0}
    for tag, i1, i2, j1, j2 in s.get_opcodes():
        if tag == 'replace': stats["chg"] += 1
        elif tag == 'delete': stats["del"] += 1
        elif tag == 'insert': stats["add"] += 1
    
    # Generate HTML table
    diff_html = difflib.HtmlDiff(wrapcolumn=40).make_table(text1, text2)
    return diff_html, stats

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/archive-search", methods=["POST"])
def archive_search():
    url = request.json.get("url")
    wide = request.json.get("wide", False)
    if not url:
        return jsonify({"error": "URL is required"}), 400
    
    try:
        # Use CDX API to find PDF captures
        cdx_params = {
            "url": url,
            "output": "json",
            "filter": "mimetype:application/pdf",
        }
        
        if wide:
            cdx_params["matchType"] = "prefix"
            cdx_params["collapse"] = "urlkey" # Discover unique files
        else:
            cdx_params["collapse"] = "digest" # Discover unique versions of one file

        cdx_url = "https://web.archive.org/cdx/search/cdx"
        response = wayback_session.get(cdx_url, params=cdx_params, timeout=30)
        
        if response.status_code != 200:
            print(f"Wayback error: {response.status_code} - {response.text}")
            return jsonify({"error": f"Wayback Machine API returned {response.status_code}"}), 500
        
        try:
            data = response.json()
        except Exception:
            return jsonify({"results": []}) # Sometimes returns text if no results
            
        if not data or len(data) <= 1:
            return jsonify({"results": []})
        
        results = []
        header = data[0]
        for row in data[1:]:
            if len(row) != len(header): continue
            item = dict(zip(header, row))
            # Extract filename for display
            original_url = item.get("original", "")
            filename = original_url.split("/")[-1] or "document.pdf"
            
            results.append({
                "timestamp": item.get("timestamp", ""),
                "url": f"https://web.archive.org/web/{item['timestamp']}id_/{original_url}",
                "display_date": item.get("timestamp", ""),
                "filename": filename,
                "original_url": original_url
            })
        
        return jsonify({"results": results[::-1]})
    except requests.exceptions.Timeout:
        return jsonify({"error": "Wayback Machine search timed out"}), 504
    except Exception as e:
        print(f"Archive search error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/compare", methods=["POST"])
def compare():
    # We support any combination of Local File and Wayback URL
    # Slot 1 can be file1 or url1
    # Slot 2 can be file2 or url2
    
    # Check JSON or Form for URLs
    data = request.json if request.is_json else request.form
    u1 = data.get("url1")
    u2 = data.get("url2")
    
    # Check Files
    f1 = request.files.get("file1")
    f2 = request.files.get("file2")
    
    texts = [None, None]
    
    # Process Slot 1
    if f1 and f1.filename != "":
        texts[0] = extract_text(f1)
    elif u1:
        try:
            r1 = wayback_session.get(u1, timeout=30)
            texts[0] = extract_text(r1.content)
        except Exception as e:
            return jsonify({"error": f"Failed to fetch Archive 1: {str(e)}"}), 500
    
    # Process Slot 2
    if f2 and f2.filename != "":
        texts[1] = extract_text(f2)
    elif u2:
        try:
            r2 = wayback_session.get(u2, timeout=30)
            texts[1] = extract_text(r2.content)
        except Exception as e:
            return jsonify({"error": f"Failed to fetch Archive 2: {str(e)}"}), 500

    if not texts[0]:
        return jsonify({"error": "Source 1 missing or unreadable. Upload a file or select a snapshot."}), 400
    if not texts[1]:
        return jsonify({"error": "Source 2 missing or unreadable. Upload a file or select a snapshot."}), 400

    diff_table, stats = word_diff(texts[0], texts[1])
    return jsonify({
        "diff": diff_table,
        "stats": stats
    })

if __name__ == "__main__":
    app.run(debug=True, port=5001)