import seedBooks from "../data/books.json";
import seedSeries from "../data/series.json";

export interface Book {
  id: number;
  title: string;
  author: string;
  coverUrl: string;
  review?: string | null;
  rating?: number | null;
  seriesId?: number | null;
  seriesOrder?: number | null;
  pages?: number | null;
  finishedAt?: string | null;
  createdAt: string;
}

export interface Series {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
}

export type CreateBookInput = Omit<Book, "id" | "createdAt">;
export type CreateSeriesInput = Omit<Series, "id" | "createdAt">;

const STORE_KEY = "theoeng-shelf-v1";

interface ShelfStore {
  books: Book[];
  series: Series[];
}

function getStore(): ShelfStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as ShelfStore;
  } catch {}
  const initial: ShelfStore = {
    books: seedBooks as Book[],
    series: seedSeries as Series[],
  };
  persistStore(initial);
  return initial;
}

function persistStore(store: ShelfStore): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("shelf-updated"));
}

export function getBooks(): Book[] {
  return getStore().books;
}

export function getSeries(): Series[] {
  return getStore().series;
}

export function getBook(id: number): Book | undefined {
  return getStore().books.find((b) => b.id === id);
}

export function getSingleSeries(id: number): Series | undefined {
  return getStore().series.find((s) => s.id === id);
}

function nextBookId(): number {
  const books = getBooks();
  return books.length > 0 ? Math.max(...books.map((b) => b.id)) + 1 : 1;
}

function nextSeriesId(): number {
  const series = getSeries();
  return series.length > 0 ? Math.max(...series.map((s) => s.id)) + 1 : 1;
}

export function createBook(data: CreateBookInput): Book {
  const store = getStore();
  const newBook: Book = {
    ...data,
    id: nextBookId(),
    createdAt: new Date().toISOString(),
  };
  store.books.push(newBook);
  persistStore(store);
  return newBook;
}

export function updateBook(id: number, data: CreateBookInput): Book {
  const store = getStore();
  const idx = store.books.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error("Book not found");
  store.books[idx] = { ...store.books[idx], ...data };
  persistStore(store);
  return store.books[idx];
}

export function deleteBook(id: number): void {
  const store = getStore();
  store.books = store.books.filter((b) => b.id !== id);
  persistStore(store);
}

export function createSeries(data: CreateSeriesInput): Series {
  const store = getStore();
  const newSeries: Series = {
    ...data,
    id: nextSeriesId(),
    createdAt: new Date().toISOString(),
  };
  store.series.push(newSeries);
  persistStore(store);
  return newSeries;
}

export function updateSeries(id: number, data: CreateSeriesInput): Series {
  const store = getStore();
  const idx = store.series.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Series not found");
  store.series[idx] = { ...store.series[idx], ...data };
  persistStore(store);
  return store.series[idx];
}

export function deleteSeries(id: number): void {
  const store = getStore();
  store.series = store.series.filter((s) => s.id !== id);
  store.books = store.books.map((b) =>
    b.seriesId === id ? { ...b, seriesId: null, seriesOrder: null } : b
  );
  persistStore(store);
}
