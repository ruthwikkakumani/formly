"use client";

import { useParams } from "next/navigation";

import { PublicFormView } from "@/components/respondent/PublicFormView";

export default function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>();
  return <PublicFormView slug={slug} />;
}
