"use client";

import { useParams } from "next/navigation";

import { BuilderView } from "@/components/builder/BuilderView";

export default function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  return <BuilderView id={id} />;
}
