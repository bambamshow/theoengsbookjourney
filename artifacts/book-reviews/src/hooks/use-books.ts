import { useQueryClient } from "@tanstack/react-query";
import { 
  useListBooks, 
  useGetBook, 
  useCreateBook, 
  useUpdateBook, 
  useDeleteBook,
  getListBooksQueryKey,
  getGetBookQueryKey
} from "@workspace/api-client-react";
import type { CreateBookInput } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useBooks() {
  return useListBooks();
}

export function useBook(id: number) {
  return useGetBook(id, {
    query: {
      enabled: !isNaN(id) && id > 0,
    }
  });
}

export function useCreateBookMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const mutation = useCreateBook();

  const mutate = (data: CreateBookInput) => {
    mutation.mutate(
      { data },
      {
        onSuccess: (newBook) => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          toast({
            title: "Book added",
            description: "Your book has been successfully added to your shelf.",
          });
          setLocation(`/book/${newBook.id}`);
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Failed to add book",
            description: error.message || "An unexpected error occurred.",
          });
        }
      }
    );
  };

  return { ...mutation, mutate };
}

export function useUpdateBookMutation(id: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const mutation = useUpdateBook();

  const mutate = (data: CreateBookInput) => {
    mutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBookQueryKey(id) });
          toast({
            title: "Book updated",
            description: "Your book details have been saved.",
          });
          setLocation(`/book/${id}`);
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Failed to update book",
            description: error.message || "An unexpected error occurred.",
          });
        }
      }
    );
  };

  return { ...mutation, mutate };
}

export function useDeleteBookMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const mutation = useDeleteBook();

  const mutate = (id: number) => {
    mutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          toast({
            title: "Book removed",
            description: "The book has been removed from your shelf.",
          });
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Failed to delete book",
            description: error.message || "An unexpected error occurred.",
          });
        }
      }
    );
  };

  return { ...mutation, mutate };
}
