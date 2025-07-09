"use client";

export function DeleteStoryButton({ storyId }: { storyId: string }) {
  return (
    <form action={`/api/dashboard/stories/${storyId}`} method="POST" className="inline">
      <input type="hidden" name="_method" value="DELETE" />
      <button
        type="submit"
        className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
        onClick={(e) => {
          if (!confirm("Are you sure you want to delete this story?")) {
            e.preventDefault();
          }
        }}
      >
        Delete
      </button>
    </form>
  );
}