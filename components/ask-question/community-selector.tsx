'use client';

import { useState } from 'react';
import { useCommunities } from '@/lib/hooks/use-communities';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, Globe, Lock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CommunitySelectorProps {
  selectedCommunityId: string | null;
  onCommunitySelect: (communityId: string | null) => void;
}

export function CommunitySelector({ selectedCommunityId, onCommunitySelect }: CommunitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { communities, isLoading, isError } = useCommunities(1, 20, search);

  const selectedCommunity = communities.find((c: any) => c.id === selectedCommunityId);

  const handleSelect = (communityId: string | null) => {
    onCommunitySelect(communityId);
    setIsOpen(false);
  };

  if (isError) {
    return (
      <div className="space-y-2">
        <Label>Community (Optional)</Label>
        <p className="text-sm text-red-600">Failed to load communities</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="community">Community (Optional)</Label>
      
      {/* Selected Community Display / Dropdown Trigger */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-auto p-3"
        >
          {selectedCommunity ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedCommunity.imageUrl} />
                <AvatarFallback>
                  {selectedCommunity.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedCommunity.name}</span>
                  {selectedCommunity.isPrivate ? (
                    <Lock className="h-3 w-3 text-gray-500" />
                  ) : (
                    <Globe className="h-3 w-3 text-gray-500" />
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {selectedCommunity.memberCount} members
                </p>
              </div>
            </div>
          ) : (
            <span className="text-gray-500">Select a community (optional)</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>

        {/* Dropdown */}
        {isOpen && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search communities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {/* No Community Option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Globe className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Public Question</span>
                    {!selectedCommunityId && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                  <p className="text-xs text-gray-600">Ask publicly without a community</p>
                </div>
              </button>

              {/* Loading State */}
              {isLoading && (
                <div className="px-3 py-4 text-center text-gray-500">
                  Loading communities...
                </div>
              )}

              {/* Communities List */}
              {!isLoading && communities.length === 0 && (
                <div className="px-3 py-4 text-center text-gray-500">
                  {search ? 'No communities found' : 'No communities available'}
                </div>
              )}

              {!isLoading && communities.map((community: any) => (
                <button
                  key={community.id}
                  type="button"
                  onClick={() => handleSelect(community.id)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={community.imageUrl} />
                    <AvatarFallback>
                      {community.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{community.name}</span>
                      {community.isPrivate ? (
                        <Lock className="h-3 w-3 text-gray-500" />
                      ) : (
                        <Globe className="h-3 w-3 text-gray-500" />
                      )}
                      {selectedCommunityId === community.id && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {community.memberCount} members • {community.questionCount} questions
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-sm text-gray-600">
        {selectedCommunity 
          ? `Your question will be posted to the ${selectedCommunity.name} community.`
          : 'Select a community to target your question to a specific audience, or leave blank for a public question.'
        }
      </p>
    </div>
  );
}
