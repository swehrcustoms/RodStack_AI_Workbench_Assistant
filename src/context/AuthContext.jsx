import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase, supabaseEnabled } from "../lib/supabaseClient.js";
import { canAccessAdminConsole } from "../lib/auth/roles";

const LOCAL_AUTH_KEY = "rodstack.local.auth.v1";

const AuthContext = createContext(null);

export function isProductionAuthRequired() {
  return import.meta.env.PROD === true;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [platformRole, setPlatformRole] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [authReady, setAuthReady] = useState(false);
  const [configError, setConfigError] = useState(null);

  const loadPlatformContext = useCallback(async (userId) => {
    if (!supabaseEnabled || !supabase || !userId) {
      setProfile(null);
      setPlatformRole(null);
      setMemberships([]);
      return;
    }

    try {
      const [{ data: profileRow }, { data: adminRow }, { data: memberRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("platform_admins").select("platform_role").eq("user_id", userId).maybeSingle(),
        supabase
          .from("organization_members")
          .select("role, organization_id, organizations(id, name, slug)")
          .eq("user_id", userId),
      ]);

      setProfile(profileRow || null);
      setPlatformRole(adminRow?.platform_role || null);
      setMemberships(memberRows || []);
    } catch {
      setProfile(null);
      setPlatformRole(null);
      setMemberships([]);
    }
  }, []);

  useEffect(() => {
    let unsub = () => {};

    const init = async () => {
      if (isProductionAuthRequired() && !supabaseEnabled) {
        setConfigError(
          "Production requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Local password auth is disabled in production."
        );
        setAuthReady(true);
        return;
      }

      if (supabaseEnabled && supabase) {
        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        if (data.session?.user) await loadPlatformContext(data.session.user.id);

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => {
          setSession(next);
          setUser(next?.user ?? null);
          if (next?.user) await loadPlatformContext(next.user.id);
          else {
            setProfile(null);
            setPlatformRole(null);
            setMemberships([]);
          }
        });
        unsub = () => listener.subscription.unsubscribe();
      } else {
        try {
          const raw = localStorage.getItem(LOCAL_AUTH_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            setUser(parsed.session || null);
            setProfile({
              id: parsed.session?.id,
              email: parsed.session?.email,
              builder_name: parsed.session?.builderName,
              shop_name: parsed.session?.shopName,
            });
          }
        } catch {
          /* ignore */
        }
      }
      setAuthReady(true);
    };

    init();
    return () => unsub();
  }, [loadPlatformContext]);

  const signUp = useCallback(async ({ email, password, builderName, shopName, fullName }) => {
    if (isProductionAuthRequired() && !supabaseEnabled) {
      throw new Error(configError || "Supabase auth required in production");
    }
    if (supabaseEnabled && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            builder_name: builderName || "",
            shop_name: shopName || "",
            full_name: fullName || builderName || "",
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      return {
        user: data.user,
        needsEmailVerification: !data.session,
      };
    }

    const users = JSON.parse(localStorage.getItem("rodstack.local.users") || "[]");
    if (users.find((u) => u.email === email)) throw new Error("Account already exists");
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const passwordHash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const localUser = {
      id: `USER-${Date.now()}`,
      email,
      passwordHash,
      builderName,
      shopName,
    };
    users.push(localUser);
    localStorage.setItem("rodstack.local.users", JSON.stringify(users));
    const sessionUser = {
      id: localUser.id,
      email,
      builderName,
      shopName,
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ session: sessionUser }));
    setUser(sessionUser);
    setProfile({
      id: localUser.id,
      email,
      builder_name: builderName,
      shop_name: shopName,
    });
    return { user: sessionUser, needsEmailVerification: false };
  }, [configError]);

  const signIn = useCallback(async ({ email, password }) => {
    if (isProductionAuthRequired() && !supabaseEnabled) {
      throw new Error(configError || "Supabase auth required in production");
    }
    if (supabaseEnabled && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    }
    const users = JSON.parse(localStorage.getItem("rodstack.local.users") || "[]");
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const passwordHash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const found = users.find((u) => u.email === email && u.passwordHash === passwordHash);
    if (!found) throw new Error("Invalid email or password");
    const sessionUser = {
      id: found.id,
      email: found.email,
      builderName: found.builderName,
      shopName: found.shopName,
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ session: sessionUser }));
    setUser(sessionUser);
    setProfile({
      id: found.id,
      email: found.email,
      builder_name: found.builderName,
      shop_name: found.shopName,
    });
    return sessionUser;
  }, [configError]);

  const signOut = useCallback(async () => {
    if (supabaseEnabled && supabase) await supabase.auth.signOut();
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setSession(null);
    setUser(null);
    setProfile(null);
    setPlatformRole(null);
    setMemberships([]);
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!supabaseEnabled || !supabase) {
      throw new Error("Password reset requires Supabase Auth");
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#view=profile`,
    });
    if (error) throw error;
    return true;
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    if (!supabaseEnabled || !supabase) {
      throw new Error("Password update requires Supabase Auth");
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      if (!user?.id) throw new Error("Not signed in");
      if (supabaseEnabled && supabase) {
        const { data, error } = await supabase
          .from("profiles")
          .update({
            full_name: patch.fullName ?? patch.full_name,
            builder_name: patch.builderName ?? patch.builder_name,
            shop_name: patch.shopName ?? patch.shop_name,
            avatar_url: patch.avatarUrl ?? patch.avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select("*")
          .maybeSingle();
        if (error) throw error;
        setProfile(data);
        return data;
      }
      setProfile((p) => ({ ...p, ...patch }));
      return patch;
    },
    [user]
  );

  const refreshAuthContext = useCallback(async () => {
    if (user?.id) await loadPlatformContext(user.id);
  }, [user, loadPlatformContext]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      platformRole,
      memberships,
      authReady,
      configError,
      supabaseEnabled,
      isAdmin: canAccessAdminConsole(platformRole),
      primaryOrgId: memberships[0]?.organization_id || memberships[0]?.organizations?.id || null,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      refreshAuthContext,
    }),
    [
      session,
      user,
      profile,
      platformRole,
      memberships,
      authReady,
      configError,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      refreshAuthContext,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
