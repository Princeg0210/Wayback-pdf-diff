import fitz
import difflib


def extract_text(pdf_path, max_pages=10):
    doc = fitz.open(pdf_path)
    text = []

    for i, page in enumerate(doc):
        if i >= max_pages:
            break

        content = page.get_text("text")

        if content:
            # clean text
            content = content.replace("\n", " ")
            content = " ".join(content.split())

            text.append(content)

    return text



def word_diff(text1, text2):
    words1 = " ".join(text1).split()
    words2 = " ".join(text2).split()

    return difflib.HtmlDiff().make_file(
        [" ".join(words1)],
        [" ".join(words2)]
    )



pdf1 = extract_text("file1.pdf", max_pages=10)
pdf2 = extract_text("file2.pdf", max_pages=10)


html = word_diff(pdf1, pdf2)


with open("output.html", "w") as f:
    f.write(html)

print("✅ Open output.html in browser")