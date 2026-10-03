import {
  generateBlogPaginationItems,
  getBlogPaginationUrl,
  type BlogPagination as BlogPaginationData,
} from "@/lib/blog-index";
import {
  Pagination,
  PaginationContent,
  PaginationDisabled,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export default function BlogPagination({
  basePath,
  hash,
  onDark,
  pagination,
}: {
  basePath?: string;
  /** Fragment added to page links so a new page opens at the post list. */
  hash?: string;
  onDark?: boolean;
  pagination: BlogPaginationData;
}) {
  if (pagination.totalPages <= 1) return null;
  const items = generateBlogPaginationItems(
    pagination.currentPage,
    pagination.totalPages,
  );
  const pageHref = (page: number) =>
    `${getBlogPaginationUrl(page, basePath)}${hash ? `#${hash}` : ""}`;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {pagination.hasPreviousPage ? (
            <PaginationPrevious
              href={pageHref(pagination.currentPage - 1)}
              onDark={onDark}
            />
          ) : (
            <PaginationDisabled>
              <ChevronLeftIcon aria-hidden="true" />
              <span className="hidden sm:block">Previous</span>
            </PaginationDisabled>
          )}
        </PaginationItem>
        {items.map((item, index) => (
          <PaginationItem key={item === "ellipsis" ? `ellipsis-${index}` : item}>
            {item === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                aria-label={`Go to page ${item}`}
                href={pageHref(item)}
                isActive={item === pagination.currentPage}
                onDark={onDark}
              >
                {item}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          {pagination.hasNextPage ? (
            <PaginationNext
              href={pageHref(pagination.currentPage + 1)}
              onDark={onDark}
            />
          ) : (
            <PaginationDisabled>
              <span className="hidden sm:block">Next</span>
              <ChevronRightIcon aria-hidden="true" />
            </PaginationDisabled>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
