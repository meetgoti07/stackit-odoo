'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createCommunity } from '@/lib/hooks/use-communities';
import { Header } from '@/components/header/header';
import { Sidebar } from '@/components/sidebar/sidebar';
import { RightSidebar } from '@/components/sidebar-right/right-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateCommunityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    imageUrl: '',
    bannerUrl: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePrivateChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isPrivate: checked }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Community name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Community name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL';
    }

    if (formData.bannerUrl && !isValidUrl(formData.bannerUrl)) {
      newErrors.bannerUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const community = await createCommunity({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isPrivate: formData.isPrivate,
        imageUrl: formData.imageUrl.trim() || undefined,
        bannerUrl: formData.bannerUrl.trim() || undefined
      });

      // Redirect to the newly created community
      router.push(`/communities/${community.id}`);
    } catch (error) {
      console.error('Error creating community:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to create community' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-6 max-w-4xl">
          {/* Back button */}
          <Link href="/communities">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Communities
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Create New Community</CardTitle>
              <CardDescription>
                Start a new community to bring together people with shared interests.
              </CardDescription>
            </CardHeader>
            <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Community Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter community name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this community is about..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500">
                {formData.description.length}/500 characters
              </p>
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Community Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Community Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className={errors.imageUrl ? 'border-red-500' : ''}
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-600">{errors.imageUrl}</p>
              )}
              <p className="text-sm text-gray-500">
                Optional: Add a profile image for your community
              </p>
            </div>

            {/* Banner Image URL */}
            <div className="space-y-2">
              <Label htmlFor="bannerUrl">Banner Image URL</Label>
              <Input
                id="bannerUrl"
                name="bannerUrl"
                type="url"
                value={formData.bannerUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/banner.jpg"
                className={errors.bannerUrl ? 'border-red-500' : ''}
              />
              {errors.bannerUrl && (
                <p className="text-sm text-red-600">{errors.bannerUrl}</p>
              )}
              <p className="text-sm text-gray-500">
                Optional: Add a banner image for your community
              </p>
            </div>

            {/* Privacy Setting */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={handlePrivateChange}
              />
              <Label htmlFor="isPrivate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Make this community private
              </Label>
            </div>
            <p className="text-sm text-gray-500">
              Private communities require approval to join and are not discoverable in search.
            </p>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Creating...' : 'Create Community'}
              </Button>
              <Link href="/communities">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
    <RightSidebar />
  </div>
</div>
);
}
