"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Palette, Sparkles } from "lucide-react"

interface UserLoginProps {
  onLogin: (user: any) => void
}

const avatarColors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0891b2",
  "#0284c7",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
]

export default function UserLogin({ onLogin }: UserLoginProps) {
  const [name, setName] = useState("")
  const [selectedColor, setSelectedColor] = useState(avatarColors[0])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 800))

    const user = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      color: selectedColor,
    }

    localStorage.setItem("whiteboard-user", JSON.stringify(user))

    onLogin(user)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-balance">Collaborative Whiteboard</h1>
          </div>
          <p className="text-muted-foreground text-balance">A modern real-time drawing and collaboration tool</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Join Whiteboard</CardTitle>
            <CardDescription>Enter your name and choose a color to start collaborating</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center">
                <Avatar className="w-16 h-16 border-2 transition-all" style={{ borderColor: selectedColor }}>
                  <AvatarFallback
                    className="text-white font-semibold text-lg transition-colors"
                    style={{ backgroundColor: selectedColor }}
                  >
                    {name.trim() ? name.trim().charAt(0).toUpperCase() : <Palette className="w-6 h-6" />}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  required
                  className="transition-all focus:scale-[1.02]"
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Choose Your Color
                </Label>
                <div className="grid grid-cols-8 gap-2">
                  {avatarColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        selectedColor === color ? "border-foreground scale-110 shadow-lg" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full transition-all hover:scale-[1.02]"
                disabled={!name.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </div>
                ) : (
                  "Join Whiteboard"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
