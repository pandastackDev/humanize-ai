"""
File parsing endpoint for extracting text from PDF, DOCX, and TXT files.
"""

import logging
from io import BytesIO

from docx import Document
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from pypdf import PdfReader

logger = logging.getLogger(__name__)

router = APIRouter()


class ParseFileResponse(BaseModel):
    """Response model for file parsing."""

    text: str
    file_type: str
    file_name: str


def get_file_type(filename: str) -> str:
    """Determine file type from filename."""
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        return "pdf"
    if filename_lower.endswith(".docx"):
        return "docx"
    if filename_lower.endswith(".txt"):
        return "txt"
    if filename_lower.endswith(".doc"):
        return "doc"
    return "unknown"


async def parse_pdf(file_content: bytes) -> str:
    """Extract text from PDF file."""
    try:
        pdf_file = BytesIO(file_content)
        reader = PdfReader(pdf_file)
        text_parts = []

        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)

        return "\n\n".join(text_parts).strip()
    except Exception as e:
        logger.error(f"Error parsing PDF: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse PDF file: {str(e)}. Please ensure the file is not corrupted.",
        )


async def parse_docx(file_content: bytes) -> str:
    """Extract text from DOCX file."""
    try:
        docx_file = BytesIO(file_content)
        doc = Document(docx_file)
        text_parts = []

        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)

        return "\n\n".join(text_parts).strip()
    except Exception as e:
        logger.error(f"Error parsing DOCX: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse DOCX file: {str(e)}. Please ensure the file is not corrupted.",
        )


async def parse_txt(file_content: bytes) -> str:
    """Extract text from TXT file."""
    try:
        text = file_content.decode("utf-8")
        return text.strip()
    except UnicodeDecodeError:
        # Try other encodings
        try:
            text = file_content.decode("latin-1")
            return text.strip()
        except Exception as e:
            logger.error(f"Error parsing TXT: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse TXT file: {str(e)}. Please ensure the file encoding is supported.",
            )


@router.post("/", response_model=ParseFileResponse)
async def parse_file(file: UploadFile = File(...)) -> ParseFileResponse:
    """
    Parse uploaded file and extract text content.

    Supports:
    - PDF files (.pdf)
    - DOCX files (.docx)
    - TXT files (.txt)
    """
    # Validate file type
    file_type = get_file_type(file.filename or "")
    if file_type == "unknown":
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a .pdf, .docx, or .txt file.",
        )

    if file_type == "doc":
        raise HTTPException(
            status_code=400,
            detail="Please convert your .doc file to .docx format, or paste the text directly.",
        )

    # Read file content
    try:
        file_content = await file.read()
    except Exception as e:
        logger.error(f"Error reading file: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file: {str(e)}",
        )

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="File is empty. Please upload a file with content.",
        )

    # Parse file based on type
    try:
        if file_type == "pdf":
            extracted_text = await parse_pdf(file_content)
        elif file_type == "docx":
            extracted_text = await parse_docx(file_content)
        elif file_type == "txt":
            extracted_text = await parse_txt(file_content)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_type}",
            )

        if not extracted_text or not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the file. Please try another file or paste the text directly.",
            )

        return ParseFileResponse(
            text=extracted_text,
            file_type=file_type,
            file_name=file.filename or "unknown",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse file: {str(e)}. Please try copying and pasting the text directly.",
        )
