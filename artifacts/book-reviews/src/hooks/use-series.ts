import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import * as store from "@/lib/local-store";
import type { Series, CreateSeriesInput } from "@/lib/local-store";

function useShelfSeries() {
  const [series, setSeries] = useState(() => store.getSeries());
  useEffect(() => {
    const refresh = () => setSeries(store.getSeries());
    window.addEventListener("shelf-updated", refresh);
    return () => window.removeEventListener("shelf-updated", refresh);
  }, []);
  return series;
}

export function useSeries() {
  const data = useShelfSeries();
  const refetch = useCallback(() => Promise.resolve({ data }), [data]);
  return { data, isLoading: false, error: null, refetch };
}

export function useSingleSeries(id: number) {
  const series = useShelfSeries();
  const data = id > 0 ? series.find((s) => s.id === id) : undefined;
  return { data, isLoading: false, error: null };
}

export function useCreateSeriesMutation() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const mutate = useCallback(
    (
      data: CreateSeriesInput,
      options?: { onSuccess?: (series: Series) => void }
    ) => {
      setIsPending(true);
      try {
        const newSeries = store.createSeries(data);
        toast({
          title: "Series created",
          description: "New series has been successfully created.",
        });
        if (options?.onSuccess) {
          options.onSuccess(newSeries);
        } else {
          setLocation("/");
        }
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to create series",
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

export function useUpdateSeriesMutation(id: number) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const mutate = useCallback(
    (data: CreateSeriesInput) => {
      setIsPending(true);
      try {
        store.updateSeries(id, data);
        toast({
          title: "Series updated",
          description: "Series details have been saved.",
        });
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to update series",
          description: e.message || "An unexpected error occurred.",
        });
      } finally {
        setIsPending(false);
      }
    },
    [id, toast]
  );

  return { mutate, isPending };
}

export function useDeleteSeriesMutation() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const mutate = useCallback(
    (id: number) => {
      setIsPending(true);
      try {
        store.deleteSeries(id);
        toast({
          title: "Series deleted",
          description: "The series has been removed.",
        });
        setLocation("/");
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Failed to delete series",
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
