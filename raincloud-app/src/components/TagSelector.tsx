'use client';

import { useState, useRef, useEffect } from 'react';
import { Tag, TagColor, TAG_COLORS, SuggestedTag, TagManager } from '../lib/TagManager';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, X, Sparkles, Check, ChevronDown } from 'lucide-react';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export function TagBadge({ tag, onRemove, size = 'sm' }: TagBadgeProps) {
  const colors = TAG_COLORS[tag.color];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} font-mono transition-all hover:opacity-80`}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-60 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

interface SuggestedTagBadgeProps {
  suggestion: SuggestedTag;
  onApply: () => void;
  onDismiss: () => void;
}

export function SuggestedTagBadge({ suggestion, onApply, onDismiss }: SuggestedTagBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 text-xs px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 font-mono group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
      <Sparkles className="h-3 w-3 text-yellow-500" />
      <span className="text-zinc-600 dark:text-zinc-400">{suggestion.name}</span>
      <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">{suggestion.confidence}%</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onApply}
          className="hover:text-green-500 transition-colors"
          title="Apply tag"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={onDismiss}
          className="hover:text-red-500 transition-colors"
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

interface ColorPickerProps {
  value: TagColor;
  onChange: (color: TagColor) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const colors: TagColor[] = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 ${TAG_COLORS[value].bg} hover:scale-110 transition-transform`}
      />
      {isOpen && (
        <div className="absolute top-8 left-0 z-50 flex gap-1 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color);
                setIsOpen(false);
              }}
              className={`w-5 h-5 ${TAG_COLORS[color].bg} ${value === color ? 'ring-2 ring-zinc-900 dark:ring-zinc-100' : ''} hover:scale-110 transition-transform`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TagSelectorProps {
  tagManager: TagManager;
  contactId: string;
  selectedTags: Tag[];
  suggestions?: SuggestedTag[];
  onTagsChange: (tags: Tag[]) => void;
  onSuggestionApplied?: (suggestion: SuggestedTag) => void;
  onSuggestionDismissed?: (suggestion: SuggestedTag) => void;
}

export function TagSelector({
  tagManager,
  contactId,
  selectedTags,
  suggestions = [],
  onTagsChange,
  onSuggestionApplied,
  onSuggestionDismissed,
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('gray');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allTags = tagManager.getAllTags();
  const filteredTags = search
    ? allTags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : allTags;

  const unselectedTags = filteredTags.filter(
    t => !selectedTags.some(st => st.id === t.id)
  );

  const activeSuggestions = suggestions.filter(
    s => !dismissedSuggestions.includes(s.name) && !selectedTags.some(t => t.name === s.name)
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag: Tag) => {
    tagManager.addTagToContact(contactId, tag.id);
    onTagsChange([...selectedTags, tag]);
    setSearch('');
  };

  const handleRemoveTag = (tag: Tag) => {
    tagManager.removeTagFromContact(contactId, tag.id);
    onTagsChange(selectedTags.filter(t => t.id !== tag.id));
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    const tag = tagManager.createTag(newTagName.trim(), newTagColor);
    handleAddTag(tag);
    setNewTagName('');
    setNewTagColor('gray');
    setShowCreateForm(false);
  };

  const handleApplySuggestion = (suggestion: SuggestedTag) => {
    const tag = tagManager.applySuggestedTag(contactId, suggestion);
    onTagsChange([...selectedTags, tag]);
    onSuggestionApplied?.(suggestion);
  };

  const handleDismissSuggestion = (suggestion: SuggestedTag) => {
    setDismissedSuggestions([...dismissedSuggestions, suggestion.name]);
    onSuggestionDismissed?.(suggestion);
  };

  return (
    <div className="space-y-2" ref={dropdownRef}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map(tag => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onRemove={() => handleRemoveTag(tag)}
          />
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all font-mono"
        >
          <Plus className="h-3 w-3" />
          Add Tag
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* AI Suggestions */}
      {activeSuggestions.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Suggested Tags
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeSuggestions.map((suggestion) => (
              <SuggestedTagBadge
                key={suggestion.name}
                suggestion={suggestion}
                onApply={() => handleApplySuggestion(suggestion)}
                onDismiss={() => handleDismissSuggestion(suggestion)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg max-h-64 overflow-hidden scale-in">
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
            <Input
              type="text"
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm h-8"
              autoFocus
            />
          </div>

          <div className="max-h-40 overflow-y-auto">
            {unselectedTags.length > 0 ? (
              unselectedTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAddTag(tag)}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                >
                  <TagBadge tag={tag} />
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-zinc-500">
                {search ? 'No matching tags' : 'All tags assigned'}
              </div>
            )}
          </div>

          {/* Create New Tag */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 p-2">
            {showCreateForm ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="text-sm h-8 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                  />
                  <ColorPicker value={newTagColor} onChange={setNewTagColor} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateTag} className="flex-1 h-7 text-xs">
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full px-3 py-1.5 text-sm text-left text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-2 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Create new tag
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TagFilterBarProps {
  tagManager: TagManager;
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
}

export function TagFilterBar({ tagManager, selectedTagIds, onSelectionChange }: TagFilterBarProps) {
  const allTags = tagManager.getAllTags();
  const stats = tagManager.getTagStats();

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onSelectionChange([...selectedTagIds, tagId]);
    }
  };

  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <span className="text-xs text-zinc-500 mr-1">Filter by tag:</span>
      {stats.map(({ tag, count }) => {
        const isSelected = selectedTagIds.includes(tag.id);
        const colors = TAG_COLORS[tag.color];
        return (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 border font-mono transition-all ${
              isSelected
                ? `${colors.bg} ${colors.text} ${colors.border}`
                : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400'
            }`}
          >
            {tag.name}
            <span className="text-[10px] opacity-60">({count})</span>
          </button>
        );
      })}
      {selectedTagIds.length > 0 && (
        <button
          onClick={() => onSelectionChange([])}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 ml-2 flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
