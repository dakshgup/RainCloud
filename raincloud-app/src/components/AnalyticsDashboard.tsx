'use client';

import { useMemo } from 'react';
import { Contact } from '../lib/ContactManager';
import { AnalyticsEngine, ContactGrowthData, CompanyDistribution, CompletenessMetrics, EngagementScore } from '../lib/Analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';

interface AnalyticsDashboardProps {
  contacts: Contact[];
}

// Mini bar chart component
function MiniBarChart({ data, maxValue }: { data: number[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((value, i) => (
        <div
          key={i}
          className="flex-1 bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 hover:bg-zinc-700 dark:hover:bg-zinc-300"
          style={{ height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`, minHeight: value > 0 ? '4px' : '0' }}
          title={`${value} contacts`}
        />
      ))}
    </div>
  );
}

// Progress ring component
function ProgressRing({ progress, size = 80, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          className="text-zinc-200 dark:text-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          strokeLinecap="square"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-zinc-900 dark:text-zinc-100 transition-all duration-500"
        />
      </svg>
      <span className="absolute text-lg font-bold">{progress}%</span>
    </div>
  );
}

// Stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  delay = 0
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  delay?: number;
}) {
  return (
    <Card className={`scale-in`} style={{ animationDelay: `${delay * 0.1}s` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <span className={`flex items-center text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Company distribution bar
function CompanyBar({ company, count, percentage, maxPercentage, index }: CompanyDistribution & { maxPercentage: number; index: number }) {
  return (
    <div className="space-y-1 fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="flex justify-between text-sm">
        <span className="truncate max-w-[150px]">{company}</span>
        <span className="text-zinc-500">{count} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-500"
          style={{ width: `${(percentage / maxPercentage) * 100}%` }}
        />
      </div>
    </div>
  );
}

// Engagement score row
function EngagementRow({ engagement, index }: { engagement: EngagementScore; index: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div
      className="flex items-center justify-between py-2 border-b border-zinc-200 dark:border-zinc-800 last:border-0 fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 ${getScoreColor(engagement.score)}`} />
        <span className="text-sm">{engagement.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {engagement.factors.hasPhone && <span className="text-xs px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800">Phone</span>}
          {engagement.factors.hasCompany && <span className="text-xs px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800">Company</span>}
          {engagement.factors.hasNotes && <span className="text-xs px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800">Notes</span>}
        </div>
        <span className="text-sm font-mono font-bold w-8 text-right">{engagement.score}</span>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard({ contacts }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    const summary = AnalyticsEngine.getSummary(contacts);
    const growthData = AnalyticsEngine.calculateGrowthData(contacts, 14);
    const completeness = AnalyticsEngine.getCompletenessMetrics(contacts);
    const engagementScores = AnalyticsEngine.calculateEngagementScores(contacts);
    const needsAttention = AnalyticsEngine.getContactsNeedingAttention(contacts);

    return {
      summary,
      growthData,
      completeness,
      engagementScores,
      needsAttention,
    };
  }, [contacts]);

  const { summary, growthData, completeness, engagementScores, needsAttention } = analytics;

  // Get last 14 days of data for mini chart
  const chartData = growthData.map(d => d.count);
  const maxCount = Math.max(...chartData, 1);

  return (
    <div className="space-y-6 font-mono fade-in-up">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contacts"
          value={summary.totalContacts}
          subtitle="In your database"
          icon={Users}
          delay={0}
        />
        <StatCard
          title="Growth Rate"
          value={`${summary.growthRate >= 0 ? '+' : ''}${summary.growthRate}%`}
          subtitle="vs previous 30 days"
          icon={TrendingUp}
          trend={{ value: summary.growthRate, positive: summary.growthRate >= 0 }}
          delay={1}
        />
        <StatCard
          title="Completeness"
          value={`${summary.completenessScore}%`}
          subtitle={`${completeness.complete} fully complete`}
          icon={CheckCircle2}
          delay={2}
        />
        <StatCard
          title="Avg Engagement"
          value={summary.avgEngagementScore}
          subtitle="Score out of 100"
          icon={Target}
          delay={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Growth Trend */}
        <Card className="scale-in" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Contact Growth (14 days)
            </CardTitle>
            <CardDescription>Cumulative contact count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={chartData} maxValue={maxCount} />
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>{growthData[0]?.date.slice(5)}</span>
              <span>{growthData[growthData.length - 1]?.date.slice(5)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Completeness */}
        <Card className="scale-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Data Completeness
            </CardTitle>
            <CardDescription>Profile completion status</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <ProgressRing progress={summary.completenessScore} />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Complete: {completeness.complete}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span>Missing Phone: {completeness.missingPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span>Missing Company: {completeness.missingCompany}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span>Missing Notes: {completeness.missingNotes}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="scale-in" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Contacts added by period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Today', value: summary.recentActivity.today },
              { label: 'This Week', value: summary.recentActivity.thisWeek },
              { label: 'This Month', value: summary.recentActivity.thisMonth },
              { label: 'This Quarter', value: summary.recentActivity.thisQuarter },
              { label: 'This Year', value: summary.recentActivity.thisYear },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Companies */}
        <Card className="scale-in" style={{ animationDelay: '0.7s' }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Top Companies
            </CardTitle>
            <CardDescription>Distribution by organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.topCompanies.length > 0 ? (
              summary.topCompanies.map((company, i) => (
                <CompanyBar
                  key={company.company}
                  {...company}
                  maxPercentage={summary.topCompanies[0]?.percentage || 100}
                  index={i}
                />
              ))
            ) : (
              <p className="text-sm text-zinc-500 text-center py-4">No company data available</p>
            )}
          </CardContent>
        </Card>

        {/* Engagement Scores */}
        <Card className="scale-in" style={{ animationDelay: '0.8s' }}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Engagement Scores
              {needsAttention.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
                  {needsAttention.length} need attention
                </span>
              )}
            </CardTitle>
            <CardDescription>Top contacts by engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              {engagementScores.slice(0, 8).map((engagement, i) => (
                <EngagementRow key={engagement.contactId} engagement={engagement} index={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
