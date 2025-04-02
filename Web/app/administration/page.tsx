'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, Users, GraduationCap, School, BookOpen, Building2, Users2, ShieldCheck, MessagesSquare, MessageCircle, MessageSquare, Loader2 } from 'lucide-react'

interface StatsData {
  name: string
  value: number
  icon: string
  color: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const iconMap = {
    'Users': Users,
    'GraduationCap': GraduationCap,
    'BookOpen': BookOpen,
    'School': School,
    'Building2': Building2,
    'Users2': Users2,
    'ShieldCheck': ShieldCheck,
    'MessagesSquare': MessagesSquare,
    'MessageCircle': MessageCircle,
    'MessageSquare': MessageSquare
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/administration/get-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap]
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.name}
                </CardTitle>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
