import os


def extract_document_text(file_path, document_type):
    try:
        if document_type == 'pdf':
            return _extract_pdf(file_path)
        elif document_type == 'docx':
            return _extract_docx(file_path)
        elif document_type in ('txt', 'md'):
            return _extract_text(file_path)
    except Exception:
        return ''
    return ''


def _extract_pdf(file_path):
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(file_path)
        text_parts = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text_parts.append(extracted)
        return '\n'.join(text_parts)
    except ImportError:
        return ''


def _extract_docx(file_path):
    try:
        import docx

        doc = docx.Document(file_path)
        text_parts = []
        for paragraph in doc.paragraphs:
            if paragraph.text:
                text_parts.append(paragraph.text)
        return '\n'.join(text_parts)
    except ImportError:
        return ''


def _extract_text(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()
