"use client";

import type { ItemCategory as ItemCategoryType } from "@humanize/api-client";
import {
  createItemApiV1ItemsPostMutation,
  deleteItemApiV1ItemsItemIdDeleteMutation,
  getSampleDataApiV1ItemsDataGetOptions,
  ItemCategory,
  Sdk,
} from "@humanize/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Initialize SDK instance for React Query
new Sdk();

export default function ClientDemo() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    value: 0,
    category: "electronics" as ItemCategoryType,
    tags: "",
  });

  // Query to fetch items using generated options
  const { data, isLoading, error, refetch } = useQuery({
    ...getSampleDataApiV1ItemsDataGetOptions(),
    refetchOnWindowFocus: true,
  });

  // Mutation to create item
  const createMutation = useMutation({
    ...createItemApiV1ItemsPostMutation(),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["getSampleDataApiV1ItemsDataGet"],
      });
      // Reset form
      setFormData({
        name: "",
        value: 0,
        category: "electronics",
        tags: "",
      });
    },
    onError: (createError) => {
      console.error("Failed to create item:", createError);
      alert("Failed to create item. Please try again.");
    },
  });

  // Mutation to delete item
  const deleteMutation = useMutation({
    ...deleteItemApiV1ItemsItemIdDeleteMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getSampleDataApiV1ItemsDataGet"],
      });
    },
    onError: (deleteError) => {
      console.error("Failed to delete item:", deleteError);
      alert("Failed to delete item. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.value < 0) {
      alert("Please fill in all required fields correctly");
      return;
    }

    createMutation.mutate({
      body: {
        name: formData.name,
        value: formData.value,
        category: formData.category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
    });
  };

  const handleDelete = (itemId: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate({
        path: { item_id: itemId },
      });
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 p-4 text-destructive">
        <h3 className="mb-2 font-semibold text-lg">Error loading data</h3>
        <p className="text-sm">{error.toString()}</p>
        <button
          className="mt-2 rounded bg-destructive px-4 py-2 text-white transition-colors hover:bg-destructive/90"
          onClick={() => refetch()}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl">
          Interactive Demo - Client Component
        </h2>
        <button
          className="cursor-not-allowed rounded-lg bg-brand-primary px-4 py-2 text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
          disabled={isLoading}
          onClick={() => refetch()}
          type="button"
        >
          {isLoading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div className="rounded-lg bg-muted p-4">
        <p className="text-foreground text-sm">
          <strong>TanStack React Query Features:</strong> Real-time updates,
          optimistic updates, automatic caching, background refetching
        </p>
      </div>

      {/* Create Item Form */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-xl">Create New Item</h3>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-sm" htmlFor="name">
                Name *
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary"
                id="name"
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter item name"
                required
                type="text"
                value={formData.name}
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-sm" htmlFor="value">
                Value *
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary"
                id="value"
                min="0"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    value: Number.parseFloat(e.target.value),
                  })
                }
                placeholder="0.00"
                required
                step="0.01"
                type="number"
                value={formData.value}
              />
            </div>

            <div>
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="category"
              >
                Category
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary"
                id="category"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as ItemCategoryType,
                  })
                }
                value={formData.category}
              >
                {Object.entries(ItemCategory).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-sm" htmlFor="tags">
                Tags (comma-separated)
              </label>
              <input
                className="w-full rounded-lg border px-3 py-2 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary"
                id="tags"
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="tag1, tag2, tag3"
                type="text"
                value={formData.tags}
              />
            </div>
          </div>

          <button
            className="w-full rounded-lg bg-success px-4 py-2 text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? "Creating..." : "Create Item"}
          </button>
        </form>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xl">Items List</h3>
          {data && (
            <span className="text-muted-foreground text-sm">
              {data.total} items total
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-primary" />
            <p className="mt-2 text-muted-foreground">Loading items...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((item) => (
              <div
                className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                key={item.id}
              >
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-semibold text-lg">{item.name}</h4>
                  <button
                    className="text-destructive text-sm hover:text-destructive disabled:opacity-50"
                    disabled={deleteMutation.isPending}
                    onClick={() => handleDelete(item.id)}
                    title="Delete item"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">ID: {item.id}</p>
                  <p className="font-bold text-lg text-success">
                    ${item.value.toFixed(2)}
                  </p>
                  {item.category && (
                    <span className="inline-block rounded bg-info-bg px-2 py-1 text-info text-xs">
                      {item.category}
                    </span>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          className="rounded bg-muted-bg-light px-2 py-0.5 text-muted-foreground text-xs"
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mutation Status */}
      {(createMutation.isPending || deleteMutation.isPending) && (
        <div className="fixed right-4 bottom-4 rounded-lg bg-brand-primary p-4 text-white shadow-lg">
          <p className="text-sm">Processing request...</p>
        </div>
      )}
    </div>
  );
}
