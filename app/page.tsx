"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Pencil, Square, Circle, Type, Eraser, Undo, Redo, Users, Download, Palette } from "lucide-react"
import UserLogin from "@/components/user-login"
import UserProfile from "@/components/user-profile"

type Tool = "pen" | "rectangle" | "circle" | "text" | "eraser"

interface User {
  id: string
  name: string
  color: string
  avatar?: string
}

interface DrawingData {
  id: string
  tool: Tool
  points: { x: number; y: number }[]
  color: string
  strokeWidth: number
  userId: string
  userName: string
  timestamp: number
  width?: number
  height?: number
  text?: string
  fontSize?: number
}

interface UserCursor {
  userId: string
  x: number
  y: number
  color: string
  name: string
  lastSeen: number
}

interface CollaborativeEvent {
  type: "drawing" | "cursor" | "user_join" | "user_leave"
  data: any
  userId: string
  timestamp: number
}

const mockUsers = [
  { id: "user1", name: "Alice", color: "#ef4444" },
  { id: "user2", name: "Bob", color: "#8b5cf6" },
  { id: "user3", name: "Charlie", color: "#f97316" },
]

export default function CollaborativeWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool>("pen")
  const [currentColor, setCurrentColor] = useState("#0891b2")
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [drawings, setDrawings] = useState<DrawingData[]>([])

  const [history, setHistory] = useState<DrawingData[][]>([])
  const [historyStep, setHistoryStep] = useState(-1)

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [connectedUsers, setConnectedUsers] = useState(mockUsers)
  const [userCursors, setUserCursors] = useState<UserCursor[]>([])
  const [isConnected, setIsConnected] = useState(true)

  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [isAddingText, setIsAddingText] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("whiteboard-user")
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
        setCurrentColor(user.color)
      } catch (error) {
        console.error("Failed to parse saved user:", error)
        localStorage.removeItem("whiteboard-user")
      }
    }
  }, [])

  useEffect(() => {
    if (drawings.length > 0) {
      const newHistory = history.slice(0, historyStep + 1)
      newHistory.push([...drawings])
      setHistory(newHistory)
      setHistoryStep(newHistory.length - 1)
    }
  }, [drawings]) // Updated dependency to drawings

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    setCurrentColor(user.color)
    console.log(`[v0] User ${user.name} joined the whiteboard`)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setDrawings([])
    setHistory([])
    setHistoryStep(-1)
    console.log(`[v0] User logged out`)
  }

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1)
      setDrawings(history[historyStep - 1] || [])
    }
  }

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1)
      setDrawings(history[historyStep + 1] || [])
    }
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const link = document.createElement("a")
      link.download = `whiteboard-${new Date().toISOString().split("T")[0]}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      setError("Failed to download image. Please try again.")
      setTimeout(() => setError(null), 3000)
    }
  }

  const simulateWebSocket = useCallback(() => {
    const interval = setInterval(() => {
      setUserCursors((prev) =>
        mockUsers.map((user) => ({
          userId: user.id,
          x: Math.random() * 800 + 100,
          y: Math.random() * 400 + 100,
          color: user.color,
          name: user.name,
          lastSeen: Date.now(),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!currentUser) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      drawGrid(ctx)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const cleanup = simulateWebSocket()

    return () => {
      cleanup()
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [simulateWebSocket, currentUser])

  useEffect(() => {
    if (!currentUser) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGrid(ctx)

    drawings.forEach((drawing) => {
      drawPath(ctx, drawing)
    })

    drawUserCursors(ctx)
  }, [drawings, userCursors, currentUser])

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas
    ctx.strokeStyle = "#f3f4f6"
    ctx.lineWidth = 1

    for (let x = 0; x <= canvas.width; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    for (let y = 0; y <= canvas.height; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  const drawPath = (ctx: CanvasRenderingContext2D, drawing: DrawingData) => {
    ctx.strokeStyle = drawing.color
    ctx.lineWidth = drawing.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    switch (drawing.tool) {
      case "pen":
        if (drawing.points.length < 2) return
        ctx.beginPath()
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
        for (let i = 1; i < drawing.points.length; i++) {
          ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
        }
        ctx.stroke()
        break

      case "rectangle":
        if (drawing.points.length >= 2) {
          const start = drawing.points[0]
          const end = drawing.points[drawing.points.length - 1]
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
        }
        break

      case "circle":
        if (drawing.points.length >= 2) {
          const start = drawing.points[0]
          const end = drawing.points[drawing.points.length - 1]
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
          ctx.beginPath()
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
        break

      case "text":
        if (drawing.text && drawing.points.length > 0) {
          ctx.fillStyle = drawing.color
          ctx.font = `${drawing.fontSize || 16}px sans-serif`
          ctx.fillText(drawing.text, drawing.points[0].x, drawing.points[0].y)
        }
        break

      case "eraser":
        if (drawing.points.length < 2) return
        ctx.globalCompositeOperation = "destination-out"
        ctx.lineWidth = drawing.strokeWidth * 2
        ctx.beginPath()
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
        for (let i = 1; i < drawing.points.length; i++) {
          ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
        }
        ctx.stroke()
        ctx.globalCompositeOperation = "source-over"
        break
    }
  }

  const drawUserCursors = (ctx: CanvasRenderingContext2D) => {
    userCursors.forEach((cursor) => {
      ctx.fillStyle = cursor.color
      ctx.beginPath()
      ctx.arc(cursor.x, cursor.y, 8, 0, 2 * Math.PI)
      ctx.fill()

      // Add white border for better visibility
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = cursor.color
      ctx.font = "12px sans-serif"
      ctx.fillText(cursor.name, cursor.x + 12, cursor.y - 8)
    })
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentUser) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (currentTool === "text") {
      setTextPosition({ x, y })
      setIsAddingText(true)
      return
    }

    setIsDrawing(true)
    setStartPoint({ x, y })

    const newDrawing: DrawingData = {
      id: `drawing-${Date.now()}-${Math.random()}`,
      tool: currentTool,
      points: [{ x, y }],
      color: currentColor,
      strokeWidth: strokeWidth,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: Date.now(),
    }

    setDrawings((prev) => [...prev, newDrawing])
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || !currentUser) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setDrawings((prev) => {
      const updated = [...prev]
      const lastDrawing = updated[updated.length - 1]
      if (!lastDrawing) return updated

      switch (currentTool) {
        case "pen":
        case "eraser":
          lastDrawing.points.push({ x, y })
          break
        case "rectangle":
        case "circle":
          lastDrawing.points = [startPoint, { x, y }]
          break
      }
      return updated
    })
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setStartPoint(null)
  }

  const handleTextSubmit = () => {
    if (!textInput.trim() || !textPosition || !currentUser) return

    const newDrawing: DrawingData = {
      id: `text-${Date.now()}-${Math.random()}`,
      tool: "text",
      points: [textPosition],
      color: currentColor,
      strokeWidth: strokeWidth,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: Date.now(),
      text: textInput,
      fontSize: 16,
    }

    setDrawings((prev) => [...prev, newDrawing])
    setTextInput("")
    setTextPosition(null)
    setIsAddingText(false)
  }

  const handleTextCancel = () => {
    setTextInput("")
    setTextPosition(null)
    setIsAddingText(false)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    draw(e)

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    console.log(`[v0] Cursor position: ${x}, ${y}`)
  }

  const clearCanvas = () => {
    setDrawings([])
    setHistory([])
    setHistoryStep(-1)
  }

  if (!currentUser) {
    return <UserLogin onLogin={handleLogin} />
  }

  const tools = [
    { id: "pen" as Tool, icon: Pencil, label: "Pen" },
    { id: "rectangle" as Tool, icon: Square, label: "Rectangle" },
    { id: "circle" as Tool, icon: Circle, label: "Circle" },
    { id: "text" as Tool, icon: Type, label: "Text" },
    { id: "eraser" as Tool, icon: Eraser, label: "Eraser" },
  ]

  const colors = ["#0891b2", "#10b981", "#f97316", "#ef4444", "#8b5cf6", "#000000"]

  return (
    <div className="h-screen bg-background flex flex-col">
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <Card className="m-4 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={currentTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTool(tool.id)}
                  className="h-10 w-10 p-0 transition-all hover:scale-105"
                  title={tool.label}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-8 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                    currentColor === color ? "border-primary scale-110" : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Select ${color}`}
                />
              ))}
            </div>

            <Separator orientation="vertical" className="h-8 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Size:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20"
                title="Brush size"
              />
              <span className="text-sm w-6">{strokeWidth}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyStep <= 0} title="Undo">
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyStep >= history.length - 1}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas} title="Clear canvas">
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} title="Download as PNG">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8 hidden sm:block" />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${isConnected ? "bg-accent" : "bg-destructive"}`}
                />
                <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{connectedUsers.length + 1} users online</span>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-1"
                  style={{ backgroundColor: `${currentUser.color}20`, color: currentUser.color }}
                >
                  {currentUser.name} (You)
                </Badge>
                {connectedUsers.slice(0, 2).map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="text-xs px-2 py-1"
                    style={{ backgroundColor: `${user.color}20`, color: user.color }}
                  >
                    {user.name}
                  </Badge>
                ))}
                {connectedUsers.length > 2 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{connectedUsers.length - 2}
                  </Badge>
                )}
              </div>

              <Separator orientation="vertical" className="h-8 hidden sm:block" />

              <UserProfile user={currentUser} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex-1 mx-4 mb-4 relative">
        <Card className="h-full p-4 shadow-sm">
          <canvas
            ref={canvasRef}
            className={`w-full h-full rounded-lg transition-all ${
              currentTool === "text"
                ? "cursor-text"
                : currentTool === "eraser"
                  ? "cursor-crosshair"
                  : "cursor-crosshair"
            } bg-background touch-none`}
            onMouseDown={startDrawing}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ touchAction: "none" }}
          />

          {isAddingText && textPosition && (
            <div
              className="absolute bg-background border border-border rounded-md p-2 shadow-lg z-10 animate-in fade-in-0 zoom-in-95"
              style={{
                left: Math.min(textPosition.x + 16, window.innerWidth - 300),
                top: Math.min(textPosition.y + 16, window.innerHeight - 100),
              }}
            >
              <div className="flex items-center gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-40"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTextSubmit()
                    if (e.key === "Escape") handleTextCancel()
                  }}
                />
                <Button size="sm" onClick={handleTextSubmit} disabled={!textInput.trim()}>
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={handleTextCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
