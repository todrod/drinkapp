import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { CATALOG_BY_ID } from './data/catalog';
import * as persistence from './db/store';
import { CatalogItem, DrinkRecipe, InventoryItem, Level, LocalProfile, PartyPlan, Prefs, ProfileIndex, ShoppingItem } from './types';
import { DEFAULT_PROFILE_INDEX, emptyProfileData } from './logic/localProfiles';
import { makeBackup, parseBackup } from './logic/backup';
import { clearPersistenceError, getPersistenceError, getPersistenceReadError, reportPersistenceError, subscribePersistenceError } from './persistenceStatus';
import { DEFAULT_PARTY, MAX_MENU, normalizeParty } from './logic/hosting';
import { isAlcoholFree, isServingReady } from './logic/recipes';
import { MY_BAR } from './data/bar';

/**
 * Data lives in SQLite (or localStorage on web) and is mirrored in memory.
 * At a few hundred rows the mirror costs nothing and keeps every screen
 * synchronous, which matters for a UI people poke at while holding a drink.
 */

interface Ctx {
  ready: boolean;
  profile: LocalProfile;
  profiles: LocalProfile[];
  storageError: string | null;
  storageReadFailed: boolean;
  createLocalBar: (name: string) => void;
  switchLocalBar: (id: string) => void;
  renameLocalBar: (name: string) => void;
  backupLocalBar: () => string;
  restoreLocalBar: (text: string) => void;
  retryDeviceSave: () => void;
  kit: InventoryItem[];
  recipes: DrinkRecipe[];
  prefs: Prefs;

  addFromCatalog: (catalogId: string) => void;
  addCustom: (name: string, category: InventoryItem['category']) => void;
  setLevel: (id: string, level: Level) => void;
  removeFromKit: (id: string) => void;
  restoreKitItem: (item: InventoryItem) => void;
  addStarterKit: () => void;
  loadMyBar: () => void;

  saveRecipe: (recipe: DrinkRecipe) => void;
  removeRecipe: (id: string) => void;
  markMade: (id: string) => void;
  undoMade: (id: string, previousLastMadeAt: number | null) => void;
  party: PartyPlan;
  setParty: (party: PartyPlan) => void;
  addToParty: (id: string) => void;
  toggleFavorite: (id: string) => void;
  rateRecipe: (id: string, rating: number) => void;

  shopping: ShoppingItem[];
  addToShopping: (catalogId: string | null, name: string) => void;
  toggleShoppingDone: (id: string) => void;
  removeFromShopping: (id: string) => void;
  /** Tick off, move into the cabinet, drop from the list — one action. */
  buyShoppingItem: (id: string) => void;
  clearBoughtShopping: () => void;

  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
}

const DataContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState<ProfileIndex>(() => {
    try { return persistence.loadProfileIndex(); } catch { return DEFAULT_PROFILE_INDEX; }
  });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => {
    clearPersistenceError();
    try { setIndex(persistence.loadProfileIndex()); setRevision((v) => v + 1); }
    catch (error) { reportPersistenceError('read'); throw error; }
  }, []);
  return <ProfileDataProvider key={`${index.activeId}-${revision}`} index={index} onIndexChange={setIndex} reload={reload}>{children}</ProfileDataProvider>;
}

function ProfileDataProvider({ children, index, onIndexChange, reload }: { children: React.ReactNode; index: ProfileIndex; onIndexChange: (index: ProfileIndex) => void; reload: () => void }) {
  const profile = index.profiles.find((p) => p.id === index.activeId)!;
  const store = useMemo(() => persistence.scopedToProfile(profile.id), [profile.id]);
  const storageError = useSyncExternalStore(subscribePersistenceError, getPersistenceError, () => null);
  const [storageReadFailed, setStorageReadFailed] = useState(false);
  const initialReadFailed = useRef(false);
  const [ready, setReady] = useState(false);
  const [kit, setKit] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<DrinkRecipe[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [party, updateParty] = useState<PartyPlan>(DEFAULT_PARTY);
  const [prefs, setPrefs] = useState<Prefs>({
    ageGateAcceptedAt: null,
    zeroProofMode: false,
    allowSubstitutes: true,
    shakeToShake: true,
  });

  useEffect(() => {
    try {
      const loaded = { kit: store.loadKit(), recipes: store.loadRecipes(), shopping: store.loadShopping(), prefs: store.loadPrefs(), party: store.loadParty() };
      setKit(loaded.kit); setRecipes(loaded.recipes); setShopping(loaded.shopping); setPrefs(loaded.prefs); updateParty(loaded.party);
    } catch { reportPersistenceError('read'); }
    initialReadFailed.current = getPersistenceReadError();
    setStorageReadFailed(initialReadFailed.current);
    setReady(true);
  }, [store]);

  const ensureSaved = useCallback(() => {
    if (getPersistenceError()) throw new Error('Resolve the device storage warning before switching bars. Export a backup of this session first.');
  }, []);
  const createLocalBar = useCallback((name: string) => {
    ensureSaved(); onIndexChange(persistence.createProfile(name, emptyProfileData(prefs.ageGateAcceptedAt)));
  }, [ensureSaved, onIndexChange, prefs.ageGateAcceptedAt]);
  const switchLocalBar = useCallback((id: string) => {
    ensureSaved(); onIndexChange(persistence.setActiveProfile(id));
  }, [ensureSaved, onIndexChange]);
  const renameLocalBar = useCallback((name: string) => {
    ensureSaved(); onIndexChange(persistence.renameProfile(profile.id, name));
  }, [ensureSaved, onIndexChange, profile.id]);
  const backupLocalBar = useCallback(() => makeBackup(profile.name, { kit, recipes, shopping, prefs, party }), [profile.name, kit, recipes, shopping, prefs, party]);
  const restoreLocalBar = useCallback((text: string) => {
    const backup = parseBackup(text);
    ensureSaved();
    backup.data.prefs.ageGateAcceptedAt = prefs.ageGateAcceptedAt;
    onIndexChange(persistence.createProfile(backup.name, backup.data));
  }, [ensureSaved, onIndexChange, prefs.ageGateAcceptedAt]);
  const retryDeviceSave = useCallback(() => {
    if (initialReadFailed.current) { reload(); return; }
    store.replaceProfileData({ kit, recipes, shopping, prefs, party });
    clearPersistenceError();
  }, [store, kit, recipes, shopping, prefs, party, reload]);

  const addFromCatalog = useCallback((catalogId: string) => {
    const cat: CatalogItem | undefined = CATALOG_BY_ID[catalogId];
    if (!cat) return;
    setKit((prev) => {
      if (prev.some((k) => k.catalogItemId === catalogId)) return prev;
      const now = Date.now();
      const item: InventoryItem = {
        id: uid(),
        catalogItemId: cat.id,
        name: cat.name,
        category: cat.category,
        brand: null,
        level: 'full',
        isStaple: cat.isStaple,
        icon: cat.icon,
        addedAt: now,
        updatedAt: now,
      };
      store.saveKitItem(item);
      return [item, ...prev];
    });
  }, []);

  const addCustom = useCallback((name: string, category: InventoryItem['category']) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const now = Date.now();
    const item: InventoryItem = {
      id: uid(),
      catalogItemId: null,
      name: trimmed,
      category,
      brand: null,
      level: 'full',
      isStaple: false,
      icon: '🫙',
      addedAt: now,
      updatedAt: now,
    };
    store.saveKitItem(item);
    setKit((prev) => [item, ...prev]);
  }, []);

  const setLevel = useCallback((id: string, level: Level) => {
    setKit((prev) =>
      prev.map((k) => {
        if (k.id !== id) return k;
        const updated = { ...k, level, updatedAt: Date.now() };
        store.saveKitItem(updated);
        return updated;
      })
    );
  }, []);

  const removeFromKit = useCallback((id: string) => {
    store.deleteKitItem(id);
    setKit((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const restoreKitItem = useCallback((item: InventoryItem) => {
    store.saveKitItem(item);
    setKit((prev) => (prev.some((k) => k.id === item.id) ? prev : [item, ...prev]));
  }, []);

  const addStarterKit = useCallback(() => {
    const { STARTER_KIT } = require('./data/catalog');
    for (const id of STARTER_KIT) addFromCatalog(id);
  }, [addFromCatalog]);

  /**
   * Loads the real shelf. Unlike addFromCatalog this does not dedupe by
   * catalog id — eight gins are eight bottles that all satisfy "gin", and the
   * kit should show them as the eight things actually standing there.
   */
  const loadMyBar = useCallback(() => {
    const now = Date.now();
    setKit((prev) => {
      const existing = new Set(prev.map((k) => k.name.toLowerCase()));
      const added: InventoryItem[] = [];
      MY_BAR.forEach(([name, catalogId, level], i) => {
        if (existing.has(name.toLowerCase())) return;
        const cat: CatalogItem | undefined = CATALOG_BY_ID[catalogId];
        if (!cat) return;
        const item: InventoryItem = {
          id: 'bar-' + catalogId + '-' + i,
          catalogItemId: catalogId,
          name,
          category: cat.category,
          brand: null,
          level: level ?? 'full',
          isStaple: cat.isStaple,
          icon: cat.icon,
          addedAt: now - i,
          updatedAt: now - i,
        };
        store.saveKitItem(item);
        added.push(item);
      });
      return [...added, ...prev];
    });
  }, []);

  const saveRecipe = useCallback((recipe: DrinkRecipe) => {
    recipe = { ...recipe, isZeroProof: isAlcoholFree(recipe) };
    store.saveRecipe(recipe);
    setRecipes((prev) => {
      const i = prev.findIndex((r) => r.id === recipe.id);
      if (i < 0) return [recipe, ...prev];
      const next = [...prev];
      next[i] = recipe;
      return next;
    });
  }, []);

  const setParty = useCallback((next: PartyPlan) => {
    const normalized = normalizeParty(next);
    store.saveParty(normalized);
    updateParty(normalized);
  }, []);

  const addToParty = useCallback((id: string) => {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe || !isServingReady(recipe) || (prefs.zeroProofMode && !isAlcoholFree(recipe))) return;
    updateParty((prev) => {
      if (prev.entries.some((e) => e.recipeId === id) || prev.entries.length >= MAX_MENU) return prev;
      const next = { ...prev, entries: [...prev.entries, { recipeId: id, servings: 8 }] };
      store.saveParty(next);
      return next;
    });
  }, [recipes, prefs.zeroProofMode]);

  const undoMade = useCallback((id: string, previousLastMadeAt: number | null) => {
    setRecipes((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const next = { ...r, timesMade: Math.max(0, r.timesMade - 1), lastMadeAt: previousLastMadeAt };
      store.saveRecipe(next);
      return next;
    }));
  }, []);

  const removeRecipe = useCallback((id: string) => {
    store.deleteRecipe(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const markMade = useCallback((id: string) => {
    setRecipes((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, timesMade: r.timesMade + 1, lastMadeAt: Date.now() };
        store.saveRecipe(updated);
        return updated;
      })
    );
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setRecipes((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, isFavorite: !r.isFavorite };
        store.saveRecipe(updated);
        return updated;
      })
    );
  }, []);

  const rateRecipe = useCallback((id: string, rating: number) => {
    setRecipes((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        // Tapping the current rating clears it, so a misfire is undoable.
        const updated = { ...r, rating: r.rating === rating ? null : rating };
        store.saveRecipe(updated);
        return updated;
      })
    );
  }, []);

  // ── Shopping list ──────────────────────────────────────────────────────

  const addToShopping = useCallback((catalogId: string | null, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setShopping((prev) => {
      // Catalog items dedupe by id; free text dedupes by name.
      const already = prev.some((s) =>
        catalogId ? s.catalogItemId === catalogId : s.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (already) return prev;
      const item: ShoppingItem = {
        id: uid(),
        catalogItemId: catalogId,
        name: trimmed,
        done: false,
        addedAt: Date.now(),
      };
      store.saveShoppingItem(item);
      return [...prev, item];
    });
  }, []);

  const toggleShoppingDone = useCallback((id: string) => {
    setShopping((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, done: !s.done };
        store.saveShoppingItem(updated);
        return updated;
      })
    );
  }, []);

  const removeFromShopping = useCallback((id: string) => {
    store.deleteShoppingItem(id);
    setShopping((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const buyShoppingItem = useCallback(
    (id: string) => {
      setShopping((prev) => {
        const item = prev.find((s) => s.id === id);
        if (!item) return prev;
        if (item.catalogItemId) addFromCatalog(item.catalogItemId);
        else addCustom(item.name, 'beverage');
        store.deleteShoppingItem(id);
        return prev.filter((s) => s.id !== id);
      });
    },
    [addFromCatalog, addCustom]
  );

  const clearBoughtShopping = useCallback(() => {
    setShopping((prev) => {
      prev.filter((s) => s.done).forEach((s) => store.deleteShoppingItem(s.id));
      return prev.filter((s) => !s.done);
    });
  }, []);

  const setPref = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      store.savePrefs(next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      profile, profiles: index.profiles, storageError, storageReadFailed,
      createLocalBar, switchLocalBar, renameLocalBar, backupLocalBar, restoreLocalBar, retryDeviceSave,
      kit,
      recipes,
      prefs,
      addFromCatalog,
      addCustom,
      setLevel,
      removeFromKit,
      restoreKitItem,
      addStarterKit,
      loadMyBar,
      saveRecipe,
      removeRecipe,
      markMade,
      undoMade, party, setParty, addToParty,
      toggleFavorite,
      rateRecipe,
      shopping,
      addToShopping,
      toggleShoppingDone,
      removeFromShopping,
      buyShoppingItem,
      clearBoughtShopping,
      setPref,
    }),
    [
      ready, profile, index.profiles, storageError, storageReadFailed,
      createLocalBar, switchLocalBar, renameLocalBar, backupLocalBar, restoreLocalBar, retryDeviceSave,
      kit, recipes, prefs, shopping, undoMade, party, setParty, addToParty,
      addFromCatalog, addCustom, setLevel, removeFromKit, restoreKitItem,
      addStarterKit, loadMyBar, saveRecipe, removeRecipe, markMade, toggleFavorite,
      rateRecipe, shopping, addToShopping, toggleShoppingDone, removeFromShopping,
      buyShoppingItem, clearBoughtShopping, setPref,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): Ctx {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
