import unittest

from app.services.chunk_service import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    chunk_text,
    normalize_text,
)


class ChunkServiceTests(unittest.TestCase):
    def test_normalize_text_preserves_paragraph_boundaries(self):
        text = " First   line\nsecond line \n\n New paragraph\t here. "

        self.assertEqual(
            normalize_text(text),
            "First line second line\n\nNew paragraph here.",
        )

    def test_chunk_text_keeps_page_and_global_offsets(self):
        text = " ".join(
            f"Sentence {index} contains useful document context."
            for index in range(45)
        )
        normalized = normalize_text(text)

        chunks = chunk_text(
            text,
            page_number=4,
            start_offset=100,
            chunk_index_start=7,
        )

        self.assertGreater(len(chunks), 1)
        self.assertEqual(
            [chunk["chunk_index"] for chunk in chunks],
            list(range(7, 7 + len(chunks))),
        )

        for chunk in chunks:
            local_start = chunk["start"] - 100
            local_end = chunk["end"] - 100

            self.assertEqual(
                normalized[local_start:local_end],
                chunk["content"],
            )
            self.assertEqual(chunk["page_start"], 4)
            self.assertEqual(chunk["page_end"], 4)
            self.assertLessEqual(chunk["length"], CHUNK_SIZE)

    def test_overlap_is_small_and_starts_on_word_boundary(self):
        text = " ".join(
            f"word{index}" for index in range(300)
        )
        normalized = normalize_text(text)
        chunks = chunk_text(text)

        self.assertGreater(len(chunks), 1)

        for previous, current in zip(chunks, chunks[1:]):
            overlap = previous["end"] - current["start"]

            self.assertGreaterEqual(overlap, 0)
            self.assertLessEqual(overlap, CHUNK_OVERLAP)

            current_start = current["start"]
            self.assertTrue(
                current_start == 0
                or normalized[current_start - 1].isspace()
            )


if __name__ == "__main__":
    unittest.main()
