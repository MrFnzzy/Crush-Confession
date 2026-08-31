"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") === "top" ? "top" : "new";

  function setSort(sort: "new" | "top") {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "new") {
      params.delete("sort");
    } else {
      params.set("sort", "top");
    }
    const qs = params.toString();
    router.push(qs ? `/wall?${qs}` : "/wall");
  }

  return (
    <div className="inline-flex rounded-full bg-paper/10 p-1 text-sm">
      <button
        onClick={() => setSort("new")}
        className={`rounded-full px-4 py-1.5 transition ${
          current === "new" ? "bg-rose text-paper" : "text-slate-300 hover:text-paper"
        }`}
      >
        Newest
      </button>
      <button
        onClick={() => setSort("top")}
        className={`rounded-full px-4 py-1.5 transition ${
          current === "top" ? "bg-rose text-paper" : "text-slate-300 hover:text-paper"
        }`}
      >
        Most related
      </button>
    </div>
  );
}
