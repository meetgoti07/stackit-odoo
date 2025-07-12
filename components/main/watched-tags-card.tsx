'use client'

import { useState } from 'react'
import { Settings, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatsCard } from "./stats-card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWatchedTags, addWatchedTag, removeWatchedTag } from '@/lib/api'
import { toast } from 'sonner'

export function WatchedTagsCard() {
  const { watchedTags, total, isLoading, error, mutate } = useWatchedTags()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)

  const handleAddTag = async () => {
    if (!newTagName.trim()) return

    setIsAddingTag(true)
    try {
      await addWatchedTag({ tagName: newTagName.trim() })
      await mutate() // Refresh the data
      setNewTagName('')
      setIsDialogOpen(false)
      toast.success('Tag added to watched list')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add tag')
    } finally {
      setIsAddingTag(false)
    }
  }

  const handleRemoveTag = async (tagId: string, tagName: string) => {
    try {
      await removeWatchedTag(tagId)
      await mutate() // Refresh the data
      toast.success(`Removed "${tagName}" from watched tags`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove tag')
    }
  }

  if (isLoading) {
    return (
      <StatsCard title="Watched tags" action={<Settings className="w-4 h-4 text-gray-400" />}>
        <div className="animate-pulse">
          <div className="flex flex-wrap gap-1 mb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded w-16"></div>
            ))}
          </div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </StatsCard>
    )
  }

  if (error) {
    return (
      <StatsCard title="Watched tags" action={<Settings className="w-4 h-4 text-gray-400" />}>
        <div className="text-sm text-gray-500">
          Unable to load watched tags
        </div>
      </StatsCard>
    )
  }

  return (
    <StatsCard 
      title="Watched tags" 
      action={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1">
              <Settings className="w-4 h-4 text-gray-400" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Watched Tags</DialogTitle>
              <DialogDescription>
                Add or remove tags to customize your content feed.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Add new tag */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add new tag</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button 
                    onClick={handleAddTag}
                    disabled={!newTagName.trim() || isAddingTag}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Current tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Current watched tags</label>
                {watchedTags.length === 0 ? (
                  <p className="text-sm text-gray-500">No watched tags yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {watchedTags.map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{tag.name}</div>
                          <div className="text-xs text-gray-500">
                            {tag.questionsCount || 0} questions
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTag(tag.id, tag.name)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="flex flex-wrap gap-1 mb-2">
        {watchedTags.length === 0 ? (
          <div className="text-sm text-gray-500">No tags watched yet</div>
        ) : (
          watchedTags.slice(0, 6).map((tag) => (
            <DropdownMenu key={tag.id}>
              <DropdownMenuTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  {tag.name}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => handleRemoveTag(tag.id, tag.name)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove tag
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))
        )}
        {watchedTags.length > 6 && (
          <Badge variant="outline" className="text-xs">
            +{watchedTags.length - 6} more
          </Badge>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Customize your content by watching tags.
      </p>
    </StatsCard>
  )
}
