import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CATALOG_BY_ID } from './data/catalog';
import * as store from './db/store';
import { CatalogItem, DrinkRecipe, InventoryItem, Level, Prefs, ShoppingItem } from './types';
import { MY_BAR } from './data/bar';

/**
 * Data lives in SQLite (or localStorage on web) and is mirrored in memory.
 * At a few hundred rows the mirror costs nothing and keeps every screen
 * synchronous, which matters for a UI people poke at while holding a drink.
 */

interface Ctx {
  ready: boolean;
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

const LEVEL_CYCLE: Level[] = ['full', 'half', 'low', 'out'];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [kit, setKit] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<DrinkRecipe[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [prefs, setPrefs] = useState<Prefs>({
    ageGateAcceptedAt: null,
    zeroProofMode: false,
    allowSubstitutes: true,
    shakeToShake: true,
  });

  useEffect(() => {
    setKit(store.loadKit());
    setRecipes(store.loadRecipes());
    setShopping(store.loadShopping());
    setPrefs(store.loadPrefs());
    setReady(true);
  }, []);

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
    store.saveRecipe(recipe);
    setRecipes((prev) => {
      const i = prev.findIndex((r) => r.id === recipe.id);
      if (i < 0) return [recipe, ...prev];
      const next = [...prev];
      next[i] = recipe;
      return next;
    });
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
      ready, kit, recipes, prefs, shopping,
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
