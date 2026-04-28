import { notFound } from "next/navigation";
import { getVertical, getVerticalSlugs } from "@/data/verticals";
import type { Metadata } from "next";
import VerticalPage from "./VerticalPage";

interface Props {
  params: Promise<{ vertical: string }>;
}

export async function generateStaticParams() {
  return getVerticalSlugs().map((slug) => ({ vertical: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vertical: slug } = await params;
  const config = getVertical(slug);
  if (!config) return {};
  return {
    title: config.meta.title,
    description: config.meta.description,
  };
}

export default async function Page({ params }: Props) {
  const { vertical: slug } = await params;
  const config = getVertical(slug);
  if (!config) notFound();
  return <VerticalPage config={config} />;
}
