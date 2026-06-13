import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import * as store from "@/lib/local-store";
import type { CreateBookInput } from "@/lib/local-store";

function useShelfBooks() {
  const [books, setBooks] = useState(() => store.getBooks());
  useEffect(() => {
    const refresh = () => setBooks(store.getBooks());
    window.addEventListener("shelf-updated", refresh);
    return () => window.removeEventListener("shelf-updated", refresh);
  }, []);
  return books;
}

export function useBooks() {
  const data = useShelfBooks();
  return { data, isLoading: false, error: null };
}

export function useBook(id: number) {
  const books = useShelfBooks();
  const data = books.find((b) => b.id === id);
  return { data, isLoading: false, error: null };
}

export function useCreateBookMutation() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const mutate = useCallback(
    (data: CreateBookInput) => {
      setIsPending(true);
      try {
        const newBook = store.createBook(data);
        toast({
          title: "Book added",
          description: "Your book has been successfully added to your shelf.",
        });
        setLocation(`/book/${newBook.id}`);
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to add book",
          description: e.message || "An unexpected error occurred.",
        });
      } finally {
        setIsPending(false);
      }
    },
    [toast, setLocation]
  );

  return { mutate, isPending };
}

export function useUpdateBookMutation(id: number) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const mutate = useCallback(
    (data: CreateBookInput) => {
      setIsPending(true);
      try {
        store.updateBook(id, data);
        toast({
          title: "Book updated",
          description: "Your book details have been saved.",
        });
        setLocation(`/book/${id}`);
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to update book",
          description: e.message || "An unexpected error occurred.",
        });
      } finally {
        setIsPending(false);
      }
    },
    [id, toast, setLocation]
  );

  return { mutate, isPending };
}

export function useDeleteBookMutation() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const mutate = useCallback(
    (id: number) => {
      setIsPending(true);
      try {
        store.deleteBook(id);
        toast({
          title: "Book removed",
          description: "The book has been removed from your shelf.",
        });
        setLocation("/");
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to delete book",
          description: e.message || "An unexpected error occurred.",
        });
      } finally {
        setIsPending(false);
      }
    },
    [toast, setLocation]
  );

  return { mutate, isPending };
}
