import { ErrorContent } from "@/components/shared/error-content";

export default function NotFound() {
  return (
    <ErrorContent
      code="404"
      title="Page Not Found"
      description="Sorry, we couldn't find the page you're looking for. It might have been moved or deleted."
    />
  );
}
