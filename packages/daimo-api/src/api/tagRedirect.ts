import { assert } from "@daimo/common";

import { DB } from "../db/db";

// Returns tag redirect URL, or null if tag does not exist.
export async function getTagRedirect(
  tag: string,
  db: DB
): Promise<string | null> {
  return (await db.loadTagRedirect(tag))?.link || null;
}

// Returns tag redirect URL, or null if tag does not exist.
export async function getTagRedirectHist(tag: string, db: DB) {
  return await db.loadTagRedirectHist(tag);
}

export async function createTagRedirect(
  tag: string,
  link: string,
  updateToken: string,
  db: DB
) {
  return await db.saveTagRedirect(tag, link, updateToken);
}

// Updates tag redirect URL, authenticatd by updateToken.
export async function setTagRedirect(
  tag: string,
  link: string,
  updateToken: string,
  db: DB
) {
  await verifyTagUpdateToken(tag, updateToken, db);
  return await db.saveTagRedirect(tag, link);
}

export async function verifyTagUpdateToken(
  tag: string,
  updateToken: string,
  db: DB
): Promise<void> {
  assert(updateToken != null && updateToken !== "", "Missing updateToken");
  const row = await db.loadTagRedirect(tag);
  assert(row != null, "Tag does not exist");
  assert(row.update_token === updateToken, "Invalid updateToken");
}
