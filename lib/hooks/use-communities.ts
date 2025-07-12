import useSWR from 'swr';
import { authClient } from '@/lib/auth-client';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
};

// Hook to fetch all communities
export function useCommunities(page = 1, limit = 10, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });

  const { data, error, mutate } = useSWR(
    `/api/communities?${params.toString()}`,
    fetcher
  );

  return {
    communities: data?.communities || [],
    pagination: data?.pagination || {},
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

// Hook to fetch a single community
export function useCommunity(id: string) {
  const { data, error, mutate } = useSWR(
    id ? `/api/communities/${id}` : null,
    fetcher
  );

  return {
    community: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

// Hook to fetch community questions
export function useCommunityQuestions(
  communityId: string,
  page = 1,
  limit = 10,
  search?: string
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });

  const { data, error, mutate } = useSWR(
    communityId ? `/api/communities/${communityId}/questions?${params.toString()}` : null,
    fetcher
  );

  return {
    questions: data?.questions || [],
    pagination: data?.pagination || {},
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

// Function to create a community
export async function createCommunity(communityData: {
  name: string;
  description?: string;
  isPrivate?: boolean;
  imageUrl?: string;
  bannerUrl?: string;
}) {
  const response = await fetch('/api/communities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(communityData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create community');
  }

  return response.json();
}

// Function to update a community
export async function updateCommunity(
  id: string,
  communityData: {
    name?: string;
    description?: string;
    isPrivate?: boolean;
    imageUrl?: string;
    bannerUrl?: string;
  }
) {
  const response = await fetch(`/api/communities/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(communityData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update community');
  }

  return response.json();
}

// Function to delete a community
export async function deleteCommunity(id: string) {
  const response = await fetch(`/api/communities/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete community');
  }

  return response.json();
}

// Function to join a community
export async function joinCommunity(id: string) {
  const response = await fetch(`/api/communities/${id}/join`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join community');
  }

  return response.json();
}

// Function to leave a community
export async function leaveCommunity(id: string) {
  const response = await fetch(`/api/communities/${id}/join`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to leave community');
  }

  return response.json();
}

// Hook to check if user is a member of a community
export function useIsMember(communityId: string) {
  const { community, isLoading } = useCommunity(communityId);
  
  // This would need session context to get current user ID
  // For now, returning basic structure
  return {
    isMember: false, // This should be calculated based on community.members and current user
    isLoading,
  };
}
