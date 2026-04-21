# 🔍 Wayback PDF Diff

[![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-%23000.svg?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Transforming historical PDF archives into meaningful visual insights.**

Wayback PDF Diff is a sophisticated prototype designed to extend the [Internet Archive's Wayback Machine](https://web.archive.org/) capabilities. While the Wayback Machine excel at diffing HTML pages, historical PDF comparisons often remain a manual, tedious task. This tool automates that process, providing a side-by-side, highlighted diff of any two PDF versions.

---

## 🌟 Key Features

- **🌐 Wayback Archive Integration**: Directly search and pull historical PDF versions using the Wayback Machine CDX API.
- **📄 Precision Extraction**: Uses `PyMuPDF` (fitz) for robust text extraction while preserving document structure.
- **🔍 Granular Comparison**: Combines sentence-level and word-level diffing to catch even the smallest changes.
- **📊 Statistical Dashboard**: Real-time breakdown of internal changes (Additions, Deletions, and Modifications).
- **🌗 Responsive Web UI**: A modern, clean interface for both archive research and local file comparison.

---

## 🛠️ Technical Architecture

This project is built with a focus on modularity and performance:

- **Backend**: Python / Flask
- **PDF Engine**: [PyMuPDF](https://pymupdf.readthedocs.io/) - Chosen for its speed and accuracy in extracting encoded text.
- **Diff Engine**: `difflib` + Custom Regex logic for sentence sanitization.
- **API integration**: Wayback Machine CDX API for metadata search and playback for content retrieval.

> [!TIP]
> The tool handles text normalization (whitespace cleaning, line-break reconstruction) to ensure that formatting changes don't clutter the actual content diff.

---

## 📸 Demo & Screenshots

<div align="center">
  <img src="https://github.com/user-attachments/assets/011b0d57-740b-456e-b358-0d2c022e6327" width="45%" alt="Search Interface" />
  <img src="https://github.com/user-attachments/assets/6be82dfe-87ab-47d6-8b2d-a766ab41ae15" width="45%" alt="Archive Results" />
  <br />
  <img src="https://github.com/user-attachments/assets/20c7aab7-6ceb-4a00-8412-71a5305ef210" width="45%" alt="Side-by-Side Diff" />
  <img src="https://github.com/user-attachments/assets/6d983edf-15cb-4b82-a333-9013a72ddc07" width="45%" alt="Statistics View" />
</div>

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Princeg0210/Wayback-pdf-diff.git
   cd wayback-pdf-diff
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Access the tool**
   Open your browser and navigate to `http://127.0.0.1:5001`.

---

## 📖 Usage Guide

1. **Archive Mode**: Enter a URL and browse through historical versions fetched directly from the Internet Archive.
2. **Local Mode**: Upload two PDF files from your machine.
3. **Analyze**: Click "Compare" to generate the diff.
4. **Insights**: Interpret the colors:
   - <kbd>🟢 Green</kbd> : Added Content
   - <kbd>🔴 Red</kbd> : Removed Content
   - <kbd>🟡 Yellow</kbd> : Modified/Changed

---

## 🗺️ Roadmap

- [ ] **OCR Support**: Integrate Tesseract for scanned/image-based PDFs.
- [ ] **Visual Diff**: Image-based (pixel-to-pixel) comparison for layout-heavy documents.
- [ ] **Batch Processing**: Compare multiple versions at once.
- [ ] **Export Options**: Save diff reports as PDF or JSON.

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## ✉️ Contact

**Prince Gupta** - [@Princeg0210](https://github.com/Princeg0210)
Project Link: [https://github.com/Princeg0210/Wayback-pdf-diff](https://github.com/Princeg0210/Wayback-pdf-diff)

<div align="center">
  <sub>Built with ❤️ for the Internet Archive Community</sub>
</div>
