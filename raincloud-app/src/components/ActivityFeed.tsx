'use client';

import { useState, useMemo } from 'react';
import {
  ActivityLog,
  ActivityEntry,
  ActivityType,
  ACTIVITY_TYPE_INFO,
  ActivityFilter,
} from '../lib/ActivityLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  UserPlus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Mail,
  Phone,
  Calendar,
  Tag,
  Upload,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  X,
  Activity,
  TrendingUp,
  Users,
} from 'lucide-react';

interface ActivityFeedProps {
  activityLog: ActivityLog;
  onContactClick?: (contactId: string) => void;
}

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  UserPlus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Mail,
  Phone,
  Calendar,
  Tag,
  TagX: Tag,
  Upload,
  Download,
};

// Color mapping for activity types
const COLOR_MAP: Record<string, string> = {
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  gray: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const info = ACTIVITY_TYPE_INFO[type];
  const Icon = ICON_MAP[info.icon] || Activity;
  const colorClass = COLOR_MAP[info.color] || COLOR_MAP.gray;

  return (
    <div className={`p-2 border ${colorClass}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

interface ActivityItemProps {
  activity: ActivityEntry;
  onContactClick?: (contactId: string) => void;
}

function ActivityItem({ activity, onContactClick }: ActivityItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = activity.changes && activity.changes.length > 0;
  const hasMetadata = activity.metadata && Object.keys(activity.metadata).length > 0;

  return (
    <div className="flex gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 fade-in-up">
      <ActivityIcon type={activity.type} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">{activity.description}</p>
            {activity.contactName && onContactClick && activity.contactId && (
              <button
                onClick={() => onContactClick(activity.contactId!)}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                {activity.contactName}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(activity.timestamp)}
          </div>
        </div>

        {/* Metadata preview */}
        {hasMetadata && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(activity.metadata!).map(([key, value]) => (
              <span
                key={key}
                className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}

        {/* Expandable changes */}
        {hasDetails && (
          <div className="mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {activity.changes!.length} field{activity.changes!.length !== 1 ? 's' : ''} changed
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-1 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                {activity.changes!.map((change, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{change.field}:</span>
                    {change.oldValue && (
                      <span className="text-red-500 line-through ml-2">{change.oldValue}</span>
                    )}
                    <span className="text-green-500 ml-2">{change.newValue || '(empty)'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityGroupProps {
  label: string;
  activities: ActivityEntry[];
  onContactClick?: (contactId: string) => void;
}

function ActivityGroup({ label, activities, onContactClick }: ActivityGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="scale-in">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center gap-2 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {label}
        <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800">{activities.length}</span>
      </button>

      {!isCollapsed && (
        <div className="pl-2">
          {activities.map(activity => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onContactClick={onContactClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterChipProps {
  type: ActivityType;
  isSelected: boolean;
  onToggle: () => void;
}

function FilterChip({ type, isSelected, onToggle }: FilterChipProps) {
  const info = ACTIVITY_TYPE_INFO[type];
  const Icon = ICON_MAP[info.icon] || Activity;

  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border transition-all ${
        isSelected
          ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
          : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400'
      }`}
    >
      <Icon className="h-3 w-3" />
      {info.label}
    </button>
  );
}

export default function ActivityFeed({ activityLog, onContactClick }: ActivityFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => activityLog.getStats(30), [activityLog]);

  const filteredActivities = useMemo(() => {
    const filter: ActivityFilter = {};

    if (selectedTypes.length > 0) {
      filter.types = selectedTypes;
    }

    if (searchQuery) {
      filter.searchQuery = searchQuery;
    }

    return activityLog.getFiltered(filter);
  }, [activityLog, selectedTypes, searchQuery]);

  const groupedActivities = useMemo(() => {
    const groups = new Map<string, ActivityEntry[]>();

    filteredActivities.forEach(activity => {
      const label = getDateLabel(activity.timestamp);
      const existing = groups.get(label) || [];
      existing.push(activity);
      groups.set(label, existing);
    });

    return groups;
  }, [filteredActivities]);

  function getDateLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (activityDate.getTime() === today.getTime()) return 'Today';
    if (activityDate.getTime() === yesterday.getTime()) return 'Yesterday';
    if (activityDate >= weekAgo) return 'This Week';
    return 'Older';
  }

  const toggleType = (type: ActivityType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const allTypes = Object.keys(ACTIVITY_TYPE_INFO) as ActivityType[];

  return (
    <div className="space-y-6 font-mono">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="scale-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
            <p className="text-xs text-zinc-500">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="scale-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Most Common
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const topType = Object.entries(stats.activitiesByType)
                .sort(([, a], [, b]) => b - a)[0];
              if (!topType || topType[1] === 0) return <span className="text-zinc-500">No activity</span>;
              const info = ACTIVITY_TYPE_INFO[topType[0] as ActivityType];
              return (
                <>
                  <div className="text-lg font-bold">{info.label}</div>
                  <p className="text-xs text-zinc-500">{topType[1]} occurrences</p>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="scale-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Most Active Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.mostActiveContacts[0] ? (
              <>
                <div className="text-lg font-bold truncate">{stats.mostActiveContacts[0].contactName}</div>
                <p className="text-xs text-zinc-500">{stats.mostActiveContacts[0].count} activities</p>
              </>
            ) : (
              <span className="text-zinc-500">No contacts</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Feed
              </CardTitle>
              <CardDescription>
                Recent actions and changes
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-9"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filter
                {selectedTypes.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 rounded-full">
                    {selectedTypes.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Filter chips */}
          {showFilters && (
            <div className="mt-4 space-y-2 fade-in-up">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Filter by activity type:</span>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={() => setSelectedTypes([])}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTypes.map(type => (
                  <FilterChip
                    key={type}
                    type={type}
                    isSelected={selectedTypes.includes(type)}
                    onToggle={() => toggleType(type)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No activities found</p>
              <p className="text-sm">
                {searchQuery || selectedTypes.length > 0
                  ? 'Try adjusting your filters'
                  : 'Activities will appear here as you use the CRM'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(groupedActivities.entries()).map(([label, activities], i) => (
                <ActivityGroup
                  key={label}
                  label={label}
                  activities={activities}
                  onContactClick={onContactClick}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity Distribution</CardTitle>
          <CardDescription>Breakdown by activity type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.activitiesByType)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const info = ACTIVITY_TYPE_INFO[type as ActivityType];
                const percentage = stats.totalActivities > 0
                  ? Math.round((count / stats.totalActivities) * 100)
                  : 0;

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <ActivityIcon type={type as ActivityType} />
                        {info.label}
                      </span>
                      <span className="text-zinc-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
