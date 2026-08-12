import { useParams } from "react-router-dom";
import BlogPostContent from "./blog-post-content";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  return <BlogPostContent slug={slug ?? ""} />;
}
