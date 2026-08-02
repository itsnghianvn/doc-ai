CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
MIN_CHUNK_SIZE = 200
def chunk_text(text:str) -> list[dict]: 
    chunks = []
    start = 0
    chunk_id = 1
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        text = text.replace("\n", " ")
        chunk_content = text[start:end]
        chunks.append({
            "id": chunk_id, 
            "start": start,
            "end": end,
            "length": len(chunk_content),
            "content": chunk_content
            })
        
        if end == len(text):
            break
        chunk_id += 1
        start += CHUNK_SIZE - CHUNK_OVERLAP

    return list(chunks)
