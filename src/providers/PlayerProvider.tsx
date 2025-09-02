import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, Profile, PlayerDB, PlayerData } from '../lib/supabase';
import { useAuth } from './AuthProvider';

type PlayerContextValue = {
  player: PlayerData | null;
  loading: boolean;
  isActive: boolean;
  evolutionPath: 'Human' | 'Demon' | null;
  refreshPlayer: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export const usePlayer = (): PlayerContextValue => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};

export const PlayerProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayer = async (userId: string) => {
    try {
      // Fetch from both tables in parallel
      const [profileResult, playerDBResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('PlayerDB')
          .select('*')
          .eq('uuid', userId) // Use uuid column to connect tables
          .single()
      ]);

      const profile = profileResult.data;
      const playerDB = playerDBResult.data;

      // Check for errors
      if (profileResult.error && playerDBResult.error) {
        console.error('Error fetching both profile and PlayerDB data:', {
          profileError: profileResult.error,
          playerDBError: playerDBResult.error
        });
        setPlayer(null);
        return;
      }

      // Create combined player data
      const playerData: PlayerData = {
        profile: profile || null,
        playerDB: playerDB || null,
        isActive: playerDB?.status === 'Active' || false,
        evolutionPath: profile?.race || playerDB?.["Evolution Path"] || null,
      };

      setPlayer(playerData);
    } catch (err) {
      console.error('Error in fetchPlayer:', err);
      setPlayer(null);
    }
  };

  const refreshPlayer = async () => {
    if (user?.id) {
      await fetchPlayer(user.id);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchPlayer(user.id).finally(() => setLoading(false));
    } else {
      setPlayer(null);
      setLoading(false);
    }
  }, [user?.id]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      player,
      loading,
      isActive: player?.isActive || false,
      evolutionPath: player?.evolutionPath || null,
      refreshPlayer,
    }),
    [player, loading]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};
