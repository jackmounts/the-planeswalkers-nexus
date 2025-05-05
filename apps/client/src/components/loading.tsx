"use client";

import useLoadingStore from "@/store/loading.store";
import { LoaderCircle } from "lucide-react";

export function LoadingOverlay() {
  const { isLoading } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div className="fixed w-screen h-screen inset-0 flex items-center justify-center bg-white/80 z-50 pointer-events-none">
      <LoaderCircle className="animate-spin scale-200" />
    </div>
  );
}
