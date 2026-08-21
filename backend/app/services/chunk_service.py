CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
MIN_CHUNK_SIZE = 200


def chunk_text(text: str) -> list[dict]:
    text = text.replace("\n", " ")

    chunks = []
    start = 0
    chunk_id = 1

    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        chunk_content = text[start:end].strip()

        if len(chunk_content) >= MIN_CHUNK_SIZE or end == len(text):
            chunks.append(
                {
                    "id": chunk_id,
                    "start": start,
                    "end": end,
                    "length": len(chunk_content),
                    "content": chunk_content,
                }
            )

            chunk_id += 1

        if end == len(text):
            break

        start += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks