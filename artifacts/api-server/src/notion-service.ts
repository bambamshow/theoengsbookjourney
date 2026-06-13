const token = process.env["NOTION_TOKEN"];
const dbId = "37e618cd-8af9-8006-80d6-d1202b9bc64f";

const NOTION_HEADERS = {
  Authorization: `Bearer ${token || ""}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function notionFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...NOTION_HEADERS, ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API error ${res.status}: ${text}`);
  }
  return res.json() as T;
}

function getText(prop: any): string {
  const arr = prop?.rich_text || prop?.title || [];
  return arr.map((t: any) => t.plain_text).join("");
}

function getNumber(prop: any): number | null {
  return prop?.number ?? null;
}

function getUrl(prop: any): string | null {
  return prop?.url ?? null;
}

function getRating(prop: any): number | null {
  const sel = prop?.select;
  if (!sel) return null;
  const val = parseFloat(sel.name);
  return isNaN(val) ? null : val;
}

function getDate(prop: any): string | null {
  return prop?.date?.start ?? null;
}

export interface NotionBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  review: string | null;
  rating: number | null;
  pages: number | null;
  finishedAt: string | null;
  createdAt: string;
  notionId: string;
}

function pageToBook(page: any): NotionBook | null {
  const p = page.properties;
  const title = getText(p.Title);
  if (!title) return null;
  return {
    id: page.id,
    title,
    author: getText(p.Author),
    coverUrl: getUrl(p["Cover Image URL"]),
    review: getText(p.Review),
    rating: getRating(p["Your Rating"]),
    pages: getNumber(p["Number of Pages"]),
    finishedAt: getDate(p["Finished Reading Date"]),
    createdAt: page.created_time,
    notionId: page.id,
  };
}

export async function getNotionBooks(): Promise<NotionBook[]> {
  if (!token) throw new Error("Notion not configured");
  const results: NotionBook[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await notionFetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: "POST",
        body: JSON.stringify({ start_cursor: cursor, page_size: 100 }),
      },
    );
    for (const page of res.results || []) {
      const book = pageToBook(page);
      if (book) results.push(book);
    }
    cursor = res.next_cursor ?? undefined;
  } while (cursor);
  return results;
}

export async function getNotionBook(id: string): Promise<NotionBook | null> {
  if (!token) throw new Error("Notion not configured");
  try {
    const page: any = await notionFetch(`https://api.notion.com/v1/pages/${id}`);
    return pageToBook(page);
  } catch {
    return null;
  }
}

function ratingSelect(rating: number | null | undefined): any {
  if (rating === null || rating === undefined) return null;
  return { select: { name: String(rating) } };
}

export async function createNotionBook(data: {
  title: string;
  author: string;
  coverUrl?: string | null;
  review?: string | null;
  rating?: number | null;
  pages?: number | null;
  finishedAt?: string | null;
}): Promise<NotionBook> {
  if (!token) throw new Error("Notion not configured");
  const page: any = await notionFetch("https://api.notion.com/v1/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: {
        Title: { title: [{ text: { content: data.title } }] },
        Author: { rich_text: [{ text: { content: data.author } }] },
        "Cover Image URL": data.coverUrl ? { url: data.coverUrl } : { url: null },
        Review: data.review ? { rich_text: [{ text: { content: data.review } }] } : { rich_text: [] },
        "Your Rating": ratingSelect(data.rating),
        "Number of Pages": data.pages ? { number: data.pages } : { number: null },
        "Finished Reading Date": data.finishedAt ? { date: { start: data.finishedAt } } : { date: null },
      },
    }),
  });
  const book = pageToBook(page);
  if (!book) throw new Error("Failed to create Notion book");
  return book;
}

export async function updateNotionBook(id: string, data: {
  title?: string;
  author?: string;
  coverUrl?: string | null;
  review?: string | null;
  rating?: number | null;
  pages?: number | null;
  finishedAt?: string | null;
}): Promise<NotionBook | null> {
  if (!token) throw new Error("Notion not configured");
  const props: any = {};
  if (data.title !== undefined) props.Title = { title: [{ text: { content: data.title } }] };
  if (data.author !== undefined) props.Author = { rich_text: [{ text: { content: data.author } }] };
  if (data.coverUrl !== undefined) props["Cover Image URL"] = data.coverUrl ? { url: data.coverUrl } : { url: null };
  if (data.review !== undefined) props.Review = data.review ? { rich_text: [{ text: { content: data.review } }] } : { rich_text: [] };
  if (data.rating !== undefined) props["Your Rating"] = ratingSelect(data.rating);
  if (data.pages !== undefined) props["Number of Pages"] = data.pages ? { number: data.pages } : { number: null };
  if (data.finishedAt !== undefined) props["Finished Reading Date"] = data.finishedAt ? { date: { start: data.finishedAt } } : { date: null };
  await notionFetch(`https://api.notion.com/v1/pages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: props }),
  });
  return getNotionBook(id);
}

export async function deleteNotionBook(id: string): Promise<void> {
  if (!token) throw new Error("Notion not configured");
  await notionFetch(`https://api.notion.com/v1/pages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: true }),
  });
}

export function isNotionEnabled(): boolean {
  return !!token;
}
