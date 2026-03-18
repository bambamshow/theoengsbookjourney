import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/api";

export interface Comment {
  id: number;
  bookId: number;
  name: string;
  comment: string;
  createdAt: string;
}

export interface CreateCommentInput {
  name: string;
  comment: string;
}

async function fetchComments(bookId: number): Promise<Comment[]> {
  const res = await fetch(`${BASE}/books/${bookId}/comments`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

async function postComment(bookId: number, data: CreateCommentInput): Promise<Comment> {
  const res = await fetch(`${BASE}/books/${bookId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to post comment");
  return res.json();
}

async function fetchLikes(bookId: number): Promise<{ count: number }> {
  const res = await fetch(`${BASE}/books/${bookId}/likes`);
  if (!res.ok) throw new Error("Failed to fetch likes");
  return res.json();
}

async function postLike(bookId: number): Promise<{ count: number }> {
  const res = await fetch(`${BASE}/books/${bookId}/like`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to add like");
  return res.json();
}

export function useComments(bookId: number) {
  return useQuery({
    queryKey: ["comments", bookId],
    queryFn: () => fetchComments(bookId),
    enabled: bookId > 0,
  });
}

export function useCreateComment(bookId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommentInput) => postComment(bookId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", bookId] });
    },
  });
}

export function useLikes(bookId: number) {
  return useQuery({
    queryKey: ["likes", bookId],
    queryFn: () => fetchLikes(bookId),
    enabled: bookId > 0,
  });
}

export function useAddLike(bookId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => postLike(bookId),
    onSuccess: (data) => {
      qc.setQueryData(["likes", bookId], data);
    },
  });
}
