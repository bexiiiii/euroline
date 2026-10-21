import type { DetailDto } from "@/lib/api/vehicle";

/**
 * Состояние дерева каталога для конкретного автомобиля в sessionStorage:
 * раскрытые ветки, выбранная группа (с деталями), прокрутка и само дерево.
 * Нужно, чтобы при возврате «Назад» дерево открывалось как было и без повторных
 * запросов к Laximo (у них лимит).
 */

export interface SelectedGroupState {
  groupId: number;
  groupName: string;
  details: DetailDto[];
}

interface TreeState {
  open: string[];
  selected?: SelectedGroupState | null;
  scrollTop?: number;
  tree?: unknown;
  groupDetails?: Record<string, DetailDto[]>;
}

const PREFIX = "catalogTree:";

export function treeStateKey(catalog?: string, vehicleId?: string) {
  return catalog && vehicleId ? `${PREFIX}${catalog}:${vehicleId}` : null;
}

function read(key: string | null): TreeState {
  if (!key) return { open: [] };
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return { open: [] };
    const parsed = JSON.parse(raw) as TreeState;
    return { ...parsed, open: parsed.open ?? [] };
  } catch {
    return { open: [] };
  }
}

function write(key: string | null, patch: Partial<TreeState>) {
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ ...read(key), ...patch }));
  } catch {
    // переполнение/запрет хранилища — состояние просто не сохранится
  }
}

export const catalogTreeState = {
  isOpen(key: string | null, nodeKey: string) {
    return read(key).open.includes(nodeKey);
  },
  setOpen(key: string | null, nodeKey: string, open: boolean) {
    const current = new Set(read(key).open);
    if (open) current.add(nodeKey);
    else current.delete(nodeKey);
    write(key, { open: Array.from(current) });
  },
  getSelected(key: string | null) {
    return read(key).selected ?? null;
  },
  setSelected(key: string | null, selected: SelectedGroupState | null) {
    write(key, { selected });
  },
  getScrollTop(key: string | null) {
    return read(key).scrollTop ?? 0;
  },
  setScrollTop(key: string | null, scrollTop: number) {
    write(key, { scrollTop });
  },
  getTree<T>(key: string | null): T | null {
    return (read(key).tree as T) ?? null;
  },
  setTree(key: string | null, tree: unknown) {
    write(key, { tree });
  },
  getGroupDetails(key: string | null, groupId: number) {
    return read(key).groupDetails?.[String(groupId)] ?? null;
  },
  setGroupDetails(key: string | null, groupId: number, details: DetailDto[]) {
    const all = read(key).groupDetails ?? {};
    write(key, { groupDetails: { ...all, [String(groupId)]: details } });
  },
};
