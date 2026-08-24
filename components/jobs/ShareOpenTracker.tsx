"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/http/api/api";

const key = "roomkhoj_share_visitor_id";

function visitorId() {
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    localStorage.setItem(key, id);
  }
  return id;
}

export default function ShareOpenTracker() {
  const params = useSearchParams();
  const token = params.get("share");

  useEffect(() => {
    if (!token || !/^[A-Za-z0-9_-]{20,96}$/.test(token)) return;
    void api.post(`/job-posting/share-links/${encodeURIComponent(token)}/open`, {
      visitorId: visitorId(),
    }).catch(() => undefined);
  }, [token]);

  return null;
}
