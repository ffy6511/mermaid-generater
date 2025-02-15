"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mermaid 图表生成器</h1>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">输入文本</h2>
            <Textarea
              placeholder="请输入要转换为图表的文本..."
              className="min-h-[300px]"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </Card>

          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">预览</h2>
            <div className="min-h-[300px] flex items-center justify-center border rounded-md">
              <p className="text-muted-foreground">图表预览区域</p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}