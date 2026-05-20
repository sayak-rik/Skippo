"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/adminApi";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/admin/login");
    } else if (session.role === "superuser") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/admin/leads");
    }
  }, [router]);

  return null;
}
