import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

const obscenityConfig = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

enum MemoStatus {
  OK = "ok",
  TOO_LONG = "too long",
  VIOLATES_GUIDELINES = "violates guidelines",
}

export function validateMemo(memo: string | undefined): MemoStatus {
  if (!memo) return MemoStatus.OK;

  if (memo.length > 20) return MemoStatus.TOO_LONG;
  if (obscenityConfig.hasMatch(memo)) return MemoStatus.VIOLATES_GUIDELINES;

  return MemoStatus.OK;
}
