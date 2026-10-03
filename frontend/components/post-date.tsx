"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

export default function PostDate({ date }: { date: string }) {
  const [postDate, setPostDate] = useState<string>("");

  useEffect(() => {
    if (date) {
      const formattedDate = formatDate(date);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Format on the client to avoid timezone-dependent hydration differences.
      setPostDate(formattedDate);
    }
  }, [date]);

  return <div>{postDate}</div>;
}
