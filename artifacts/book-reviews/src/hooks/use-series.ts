import { useQueryClient } from "@tanstack/react-query";
import { 
  useListSeries, 
  useGetSeries, 
  useCreateSeries, 
  useUpdateSeries, 
  useDeleteSeries,
  getListSeriesQueryKey,
  getGetSeriesQueryKey,
  getListBooksQueryKey
} from "@workspace/api-client-react";
import type { CreateSeriesInput } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useSeries() {
  return useListSeries();
}

export function useSingleSeries(id: number) {
  return useGetSeries(id, {
    query: {
      enabled: !isNaN(id) && id > 0,
    }
  });
}

export function useCreateSeriesMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const mutation = useCreateSeries();

  const mutate = (data: CreateSeriesInput) => {
    mutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSeriesQueryKey() });
          toast({
            title: "Series created",
            description: "New series has been successfully created.",
          });
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Failed to create series",
            description: error.message || "An unexpected error occurred.",
          });
        }
      }
    );
  };

  return { ...mutation, mutate };
}

export function useUpdateSeriesMutation(id: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpdateSeries();

  const mutate = (data: CreateSeriesInput) => {
    mutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSeriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSeriesQueryKey(id) });
          toast({
            title: "Series updated",
            description: "Series details have been saved.",
          });
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Failed to update series",
            description: error.message || "An unexpected error occurred.",
          });
        }
      }
    );
  };

  return { ...mutation, mutate };
}

export function useDeleteSeriesMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const mutation = useDeleteSeries();

  const mutate = (id: number) => {
    mutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSeriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() }); // Books might be affected
          toast({
            title: "Series deleted",
            description: "The series has been removed.",
          });
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Failed to delete series",
            description: error.message || "An unexpected error occurred.",
          });
        }
      }
    );
  };

  return { ...mutation, mutate };
}
