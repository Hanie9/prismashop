export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: string;
  readTimeMinutes: number;
  content: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export function formatBlogDate(value: string) {
  return new Date(value).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatReadTime(minutes: number) {
  return `${minutes.toLocaleString("fa-IR")} دقیقه`;
}
