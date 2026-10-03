import { Badge } from "@/components/ui/badge";

export default function MissingSanityPage({
  document,
  documentId,
}: {
  document: string;
  documentId: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container">
        <h1 className="text-center text-2xl">
          Missing{" "}
          <Badge variant="outline" className="text-lg">
            {document}
          </Badge>{" "}
          document with ID{" "}
          <Badge variant="outline" className="text-lg">
            {documentId}
          </Badge>{" "}
          in Sanity Studio
        </h1>
      </div>
    </div>
  );
}
