import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SkillMigrationService } from '../services/SkillMigrationService';

type AuthUser = {
  id: string;
  email?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user;
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? undefined } : null);
      
      // Handle skill migration for existing sessions
      if (sessionUser?.email_confirmed_at && sessionUser.id) {
        console.log('📧 Existing session with confirmed email, checking for skill migration...');
        
        const migrationStatus = await SkillMigrationService.getMigrationStatus(sessionUser.id);
        
        if (migrationStatus.needsMigration) {
          console.log(`🔄 Migrating ${migrationStatus.inventorySkillCount} skills from InventoryDB to ClientsideSkillStorage`);
          const migrationSuccess = await SkillMigrationService.migratePlayerSkills(sessionUser.id);
          
          if (migrationSuccess) {
            console.log('✅ Skill migration completed successfully');
          } else {
            console.error('❌ Skill migration failed');
          }
        } else if (migrationStatus.hasLocalSkills) {
          console.log('✅ Skills already migrated, no action needed');
        } else {
          console.log('ℹ️ No skills found to migrate');
        }
      }
      
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionUser = session?.user;
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? undefined } : null);
      
      // Handle email confirmation and skill migration
      if (event === 'SIGNED_IN' && sessionUser?.email_confirmed_at && sessionUser.id) {
        console.log('📧 Email confirmed, checking for skill migration...');
        
        // Check if skills need migration and migrate them
        const migrationStatus = await SkillMigrationService.getMigrationStatus(sessionUser.id);
        
        if (migrationStatus.needsMigration) {
          console.log(`🔄 Migrating ${migrationStatus.inventorySkillCount} skills from InventoryDB to ClientsideSkillStorage`);
          const migrationSuccess = await SkillMigrationService.migratePlayerSkills(sessionUser.id);
          
          if (migrationSuccess) {
            console.log('✅ Skill migration completed successfully');
          } else {
            console.error('❌ Skill migration failed');
          }
        } else if (migrationStatus.hasLocalSkills) {
          console.log('✅ Skills already migrated, no action needed');
        } else {
          console.log('ℹ️ No skills found to migrate');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


