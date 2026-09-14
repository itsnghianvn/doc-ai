import re


CHUNK_SIZE = 800
CHUNK_OVERLAP = 80
MIN_CHUNK_SIZE = 120
MIN_BOUNDARY_RATIO = 0.6


def normalize_text(text: str) -> str:
    """Normalize PDF text while preserving paragraph boundaries."""

    normalized_lines = []

    for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        normalized_lines.append(
            re.sub(r"[^\S\n]+", " ", line).strip()
        )

    paragraphs = []
    paragraph_lines = []

    for line in normalized_lines:
        if line:
            paragraph_lines.append(line)
        elif paragraph_lines:
            paragraphs.append(" ".join(paragraph_lines))
            paragraph_lines = []

    if paragraph_lines:
        paragraphs.append(" ".join(paragraph_lines))

    return "\n\n".join(paragraphs)


def _find_chunk_end(text: str, start: int) -> int:
    max_end = min(start + CHUNK_SIZE, len(text))

    if max_end == len(text):
        return max_end

    min_end = start + int(CHUNK_SIZE * MIN_BOUNDARY_RATIO)
    search_window = text[min_end:max_end]

    paragraph_break = search_window.rfind("\n\n")
    if paragraph_break >= 0:
        return min_end + paragraph_break

    sentence_ends = [
        search_window.rfind(marker)
        for marker in (". ", "? ", "! ")
    ]
    sentence_end = max(sentence_ends)
    if sentence_end >= 0:
        return min_end + sentence_end + 1

    word_boundary = search_window.rfind(" ")
    if word_boundary >= 0:
        return min_end + word_boundary

    return max_end


def _find_next_start(text: str, current_start: int, end: int) -> int:
    target = max(current_start + 1, end - CHUNK_OVERLAP)

    while target < end and not text[target - 1].isspace():
        target += 1

    while target < end and text[target].isspace():
        target += 1

    return target


def chunk_text(
    text: str,
    *,
    page_number: int | None = None,
    start_offset: int = 0,
    chunk_index_start: int = 0,
) -> list[dict]:
    """Split normalized text at paragraph, sentence, or word boundaries."""

    text = normalize_text(text)
    if not text:
        return []

    chunks = []
    start = 0
    chunk_index = chunk_index_start

    while start < len(text):
        end = _find_chunk_end(text, start)
        content = text[start:end].strip()
        content_start = start + len(text[start:end]) - len(
            text[start:end].lstrip()
        )
        content_end = content_start + len(content)

        if content and (
            len(content) >= MIN_CHUNK_SIZE
            or end == len(text)
            or not chunks
        ):
            chunk = {
                "chunk_index": chunk_index,
                "start": start_offset + content_start,
                "end": start_offset + content_end,
                "length": len(content),
                "content": content,
            }

            if page_number is not None:
                chunk["page_start"] = page_number
                chunk["page_end"] = page_number

            chunks.append(chunk)
            chunk_index += 1

        if end == len(text):
            break

        next_start = _find_next_start(text, start, end)
        if next_start <= start:
            next_start = end

        start = next_start

    return chunks
