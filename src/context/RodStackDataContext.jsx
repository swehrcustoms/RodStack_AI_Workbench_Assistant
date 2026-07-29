import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { seededBlueprint } from "../data/seededBlueprint.js";
import { extendBuildRecord, createBuildFromBlueprint, cloneBuildRecord, advanceOrderStatus, uid } from "../data/buildRecord.js";
import { supabase, supabaseEnabled } from "../lib/supabaseClient.js";
import { enqueueSyncOp, loadSyncQueue, clearSyncQueue } from "../lib/syncQueue.js";
import { useAuth } from "./AuthContext.jsx";

const DATA_KEY = "rodstack.platform.v1";
const LEGACY_KEY = "rodstack.app.v2";

const DEFAULT_INVENTORY_SKUS = [
  { id: "SKU-BLANK-001", category: "blanks", name: "MHX-EPS86M 7'3\" M", supplier: "MHX", supplierUrl: "", unitCost: 89, qty: 4, lowThreshold: 2 },
  { id: "SKU-GUIDE-001", category: "guide sets", name: "Fuji Titanium Train Kit", supplier: "Fuji", supplierUrl: "", unitCost: 42, qty: 8, lowThreshold: 3 },
  { id: "SKU-THREAD-001", category: "thread spools", name: "ProWrap Navy #A", supplier: "Mud Hole", supplierUrl: "", unitCost: 6, qty: 12, lowThreshold: 4 },
  { id: "SKU-EPOXY-001", category: "epoxy/finish products", name: "Flexcoat Finish 2oz", supplier: "Flexcoat", supplierUrl: "", unitCost: 18, qty: 5, lowThreshold: 2 },
];

function loadLocalData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return {
        builds: (parsed.inventory || [seededBlueprint]).map(extendBuildRecord),
        customers: [],
        inventorySkus: DEFAULT_INVENTORY_SKUS,
        quotes: [],
        profile: { builderName: "", shopName: "", logoDataUrl: "" },
      };
    }
  } catch {
    /* ignore */
  }
  return {
    builds: [extendBuildRecord(seededBlueprint)],
    customers: [],
    inventorySkus: DEFAULT_INVENTORY_SKUS,
    quotes: [],
    profile: { builderName: "", shopName: "", logoDataUrl: "" },
  };
}

function saveLocalData(data) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch (err) {
    // QuotaExceeded or private mode — keep app running with in-memory state
    console.warn("RodStack: localStorage save failed", err?.name || err);
  }
}

const RodStackDataContext = createContext(null);

export function RodStackDataProvider({ children }) {
  const {
    user,
    authReady,
    profile: authProfile,
    primaryOrgId,
    signUp,
    signIn,
    signOut,
    updateProfile,
  } = useAuth();
  const [data, setData] = useState(loadLocalData);
  const [migrationOffered, setMigrationOffered] = useState(false);
  const [benchMode, setBenchMode] = useState(() => localStorage.getItem("rodstack.benchMode") === "1");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    saveLocalData(data);
  }, [data]);

  useEffect(() => {
    localStorage.setItem("rodstack.benchMode", benchMode ? "1" : "0");
  }, [benchMode]);

  useEffect(() => {
    if (authProfile) {
      setData((d) => ({
        ...d,
        profile: {
          ...d.profile,
          builderName: authProfile.builder_name || d.profile?.builderName || "",
          shopName: authProfile.shop_name || d.profile?.shopName || "",
        },
      }));
    }
  }, [authProfile]);

  const persistCloud = useCallback(
    async (payload) => {
      if (!user) return;
      if (supabaseEnabled && supabase) {
        const { error } = await supabase.from("rodstack_workspaces").upsert({
          user_id: user.id,
          organization_id: primaryOrgId || null,
          payload,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          setSyncError(error.message);
          enqueueSyncOp({ type: "upsert_workspace", userId: user.id, payload, organizationId: primaryOrgId });
          return;
        }
        setSyncError(null);
      } else {
        enqueueSyncOp({ type: "upsert_workspace", userId: user.id, payload, organizationId: primaryOrgId });
      }
    },
    [user, primaryOrgId]
  );

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => persistCloud(data), 800);
    return () => clearTimeout(t);
  }, [data, user, persistCloud]);

  const migrateLegacyToCloud = async () => {
    await persistCloud(data);
    setMigrationOffered(true);
    clearSyncQueue();
  };

  const flushSyncQueue = async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
      const queue = loadSyncQueue();
      if (queue.length && user && supabaseEnabled) {
        const latest = queue[queue.length - 1];
        if (latest.payload) await persistCloud(latest.payload);
        clearSyncQueue();
      }
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) flushSyncQueue();
  }, [user]);

  useEffect(() => {
    if (!user || !supabaseEnabled || !supabase) return;
    const load = async () => {
      try {
        const { data: row, error } = await supabase
          .from("rodstack_workspaces")
          .select("payload")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) {
          setSyncError(error.message);
          return;
        }
        if (row?.payload && typeof row.payload === "object") {
          setData((prev) => ({
            ...prev,
            ...row.payload,
            builds: Array.isArray(row.payload.builds) && row.payload.builds.length
              ? row.payload.builds
              : prev.builds || [],
            customers: Array.isArray(row.payload.customers) ? row.payload.customers : prev.customers || [],
            inventorySkus: Array.isArray(row.payload.inventorySkus) && row.payload.inventorySkus.length
              ? row.payload.inventorySkus
              : prev.inventorySkus || [],
            quotes: Array.isArray(row.payload.quotes) ? row.payload.quotes : prev.quotes || [],
            profile: { ...(prev.profile || {}), ...(row.payload.profile || {}) },
          }));
        }
        setSyncError(null);
      } catch (err) {
        setSyncError(err?.message || "Failed to load workspace");
      }
    };
    load();
  }, [user]);

  const updateBuild = useCallback((buildId, updater) => {
    setData((prev) => ({
      ...prev,
      builds: prev.builds.map((b) => (b.id === buildId || b.sku === buildId ? extendBuildRecord(typeof updater === "function" ? updater(b) : { ...b, ...updater }) : b)),
    }));
  }, []);

  const addBuild = useCallback((build) => {
    const record = extendBuildRecord(build);
    setData((prev) => ({ ...prev, builds: [record, ...prev.builds] }));
    return record;
  }, []);

  const cloneBuild = useCallback((sourceId, meta) => {
    const source = data.builds.find((b) => b.id === sourceId || b.sku === sourceId);
    if (!source) return null;
    const clone = cloneBuildRecord(source, meta);
    setData((prev) => ({ ...prev, builds: [clone, ...prev.builds] }));
    return clone;
  }, [data.builds]);

  const addCustomer = useCallback((customer) => {
    const record = { id: uid("CUST"), builds: [], ...customer, createdAt: new Date().toISOString() };
    setData((prev) => ({ ...prev, customers: [record, ...prev.customers] }));
    return record;
  }, []);

  const updateCustomer = useCallback((id, patch) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const addQuote = useCallback((quote) => {
    const record = { id: uid("Q"), ...quote, createdAt: new Date().toISOString() };
    setData((prev) => ({ ...prev, quotes: [record, ...prev.quotes] }));
    return record;
  }, []);

  const updateInventorySku = useCallback((id, patch) => {
    setData((prev) => ({
      ...prev,
      inventorySkus: prev.inventorySkus.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const addInventorySku = useCallback((sku) => {
    const record = { id: uid("SKU"), qty: 0, lowThreshold: 2, ...sku };
    setData((prev) => ({ ...prev, inventorySkus: [record, ...prev.inventorySkus] }));
    return record;
  }, []);

  const deductInventoryForBuild = useCallback((build) => {
    setData((prev) => ({
      ...prev,
      inventorySkus: prev.inventorySkus.map((sku) => {
        if (build.componentSkus?.includes(sku.id)) {
          return { ...sku, qty: Math.max(0, (sku.qty || 0) - 1) };
        }
        return sku;
      }),
    }));
  }, []);

  const lowStockCount = useMemo(
    () => (data.inventorySkus || []).filter((s) => (s.qty ?? 0) <= (s.lowThreshold ?? 0)).length,
    [data.inventorySkus]
  );

  const crmStats = useMemo(() => {
    const builds = data.builds || [];
    const open = builds.filter((b) => !["Complete", "Delivered"].includes(b.orderStatus)).length;
    const inProgress = builds.filter((b) =>
      ["In Progress", "Wrapping", "Curing"].includes(b.orderStatus)
    ).length;
    const month = new Date().getMonth();
    const completedMonth = builds.filter((b) => {
      if (b.orderStatus !== "Complete" && b.orderStatus !== "Delivered") return false;
      const ts = b.stageTimestamps?.Complete || b.updatedAt;
      return ts && new Date(ts).getMonth() === month;
    }).length;
    return { open, inProgress, completedMonth };
  }, [data.builds]);

  const value = {
    data,
    setData,
    user,
    authReady,
    benchMode,
    setBenchMode,
    migrationOffered,
    setMigrationOffered,
    syncing,
    syncError,
    signUp,
    signIn,
    signOut,
    updateProfile,
    migrateLegacyToCloud,
    updateBuild,
    addBuild,
    cloneBuild,
    addCustomer,
    updateCustomer,
    addQuote,
    updateInventorySku,
    addInventorySku,
    deductInventoryForBuild,
    advanceBuildStatus: (buildId, status) => updateBuild(buildId, (b) => advanceOrderStatus(b, status)),
    lowStockCount,
    crmStats,
    createBuildFromBlueprint,
    extendBuildRecord,
  };

  return <RodStackDataContext.Provider value={value}>{children}</RodStackDataContext.Provider>;
}

export function useRodStackData() {
  const ctx = useContext(RodStackDataContext);
  if (!ctx) throw new Error("useRodStackData must be used within RodStackDataProvider");
  return ctx;
}
