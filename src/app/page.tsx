import type { Metadata } from "next";
import HomePageClient from "./home-client";

export const metadata: Metadata = {
  title: "易缘起名 · AI 名匠",
  description: "为宝宝、宠物、品牌、网名等智能起名，赋予每个名字灵魂。",
};

export default function Home() {
  return <HomePageClient />;
}

