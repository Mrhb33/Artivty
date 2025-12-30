import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginCredentials, RegisterData } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types/api';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterData) => authService.register(userData),
    onSuccess: (data) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Registration error:', error);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout error:', error);
    },
  });
};

export const useCurrentUser = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<User>({
    queryKey: ['user'],
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - aggressive caching for luxury speed
  });
};

type UpdateUserPayload = {
  name?: string;
  bio?: string;
  profile_picture_url?: string | null;
  role?: 'customer' | 'artist';
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (updates: UpdateUserPayload) => authService.updateUser(updates),
    onMutate: async (updates) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['user'] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['user']);

      // Optimistically update UI
      const normalizedUpdates: Partial<User> = {
        ...updates,
        profile_picture_url: updates.profile_picture_url ?? undefined,
      };

      queryClient.setQueryData(['user'], (old: any) => ({
        ...old,
        ...normalizedUpdates,
      }));

      // Also update auth store for immediate UI sync
      updateUser(normalizedUpdates);

      return { previousUser };
    },
    onError: (err, updates, context: any) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['user'], context.previousUser);
      }
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
