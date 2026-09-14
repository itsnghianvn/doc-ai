const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;

export const tokenizePdfText = (text: string): string[] =>
  Array.from(text.toLocaleLowerCase().matchAll(TOKEN_PATTERN), (match) =>
    match[0]
  );

export const findMatchingSpanIndexes = (
  spanTexts: string[],
  sourceContent: string,
): number[] => {
  const pageTokens = spanTexts.flatMap((text, spanIndex) =>
    tokenizePdfText(text).map((value) => ({
      value,
      spanIndex,
    }))
  );
  const sourceTokens = tokenizePdfText(sourceContent);

  if (pageTokens.length === 0 || sourceTokens.length === 0) {
    return [];
  }

  const pageTokenText = ` ${pageTokens
    .map((token) => token.value)
    .join(" ")} `;
  const maximumWindow = Math.min(sourceTokens.length, 48);
  const minimumWindow = Math.min(sourceTokens.length, 8);

  for (
    let windowSize = maximumWindow;
    windowSize >= minimumWindow;
    windowSize -= 1
  ) {
    for (
      let sourceStart = 0;
      sourceStart + windowSize <= sourceTokens.length;
      sourceStart += 1
    ) {
      const candidate = ` ${sourceTokens
        .slice(sourceStart, sourceStart + windowSize)
        .join(" ")} `;
      const matchStart = pageTokenText.indexOf(candidate);

      if (matchStart === -1) {
        continue;
      }

      const tokenStart = pageTokenText
        .slice(1, matchStart + 1)
        .split(" ")
        .filter(Boolean).length;
      const matchingSpans = pageTokens
        .slice(tokenStart, tokenStart + windowSize)
        .map((token) => token.spanIndex);

      return Array.from(new Set(matchingSpans));
    }
  }

  return [];
};

export const applySourceHighlight = (
  container: HTMLElement,
  sourceContent: string,
): boolean => {
  const spans = Array.from(
    container.querySelectorAll<HTMLElement>(
      ".react-pdf__Page__textContent span"
    )
  );

  spans.forEach((span) =>
    span.classList.remove("docai-source-highlight")
  );

  const matchingIndexes = findMatchingSpanIndexes(
    spans.map((span) => span.textContent ?? ""),
    sourceContent,
  );

  matchingIndexes.forEach((index) =>
    spans[index]?.classList.add("docai-source-highlight")
  );

  spans[matchingIndexes[0]]?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  return matchingIndexes.length > 0;
};
