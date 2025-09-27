"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { bannersApi, Banner, CreateBannerRequest, UpdateBannerRequest } from "@/lib/api/promotions";
import { PageResponse } from "@/lib/api/types";

interface UseProductBannersOptions {
  pageSize?: number;
}

interface UseProductBannersResult {
  rawBanners: Banner[];
  banners: Banner[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalElements: number;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  refresh: () => Promise<void>;
  createBanner: (payload: CreateBannerRequest, file?: File | null) => Promise<Banner | null>;
  updateBanner: (id: number, payload: UpdateBannerRequest, file?: File | null) => Promise<Banner | null>;
  deleteBanner: (id: number) => Promise<boolean>;
  toggleStatus: (id: number) => Promise<Banner | null>;
  goToPage: (page: number) => void;
}

export const useProductBanners = (options: UseProductBannersOptions = {}): UseProductBannersResult => {
  const { pageSize = 10 } = options;

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response: PageResponse<Banner> = await bannersApi.getBanners(page, pageSize);
      setBanners(response.content ?? []);
      setTotalPages(response.totalPages ?? 0);
      setTotalElements(response.totalElements ?? 0);
    } catch (err) {
      console.error("Не удалось загрузить баннеры:", err);
      setError("Не удалось загрузить баннеры");
      setBanners([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const filteredBanners = useMemo(() => {
    if (!searchTerm.trim()) return banners;
    const term = searchTerm.trim().toLowerCase();
    return banners.filter((banner) =>
      banner.title.toLowerCase().includes(term) ||
      (banner.link ?? "").toLowerCase().includes(term)
    );
  }, [banners, searchTerm]);

  const refresh = useCallback(async () => {
    await fetchBanners();
  }, [fetchBanners]);

  const createBanner = useCallback(async (payload: CreateBannerRequest, file?: File | null) => {
    try {
      setError(null);
      const created = await bannersApi.createBanner(payload);
      if (created && file) {
        await bannersApi.uploadBannerImage(created.id, file);
      }
      await refresh();
      return created;
    } catch (err) {
      console.error("Ошибка при создании баннера:", err);
      setError("Не удалось создать баннер");
      return null;
    }
  }, [refresh]);

  const updateBanner = useCallback(async (id: number, payload: UpdateBannerRequest, file?: File | null) => {
    try {
      setError(null);
      const updated = await bannersApi.updateBanner(id, payload);
      if (updated && file) {
        await bannersApi.uploadBannerImage(id, file);
      }
      await refresh();
      return updated;
    } catch (err) {
      console.error("Ошибка при обновлении баннера:", err);
      setError("Не удалось обновить баннер");
      return null;
    }
  }, [refresh]);

  const deleteBanner = useCallback(async (id: number) => {
    try {
      setError(null);
      await bannersApi.deleteBanner(id);
      await refresh();
      return true;
    } catch (err) {
      console.error("Ошибка при удалении баннера:", err);
      setError("Не удалось удалить баннер");
      return false;
    }
  }, [refresh]);

  const toggleStatus = useCallback(async (id: number) => {
    try {
      setError(null);
      const updated = await bannersApi.toggleBannerStatus(id);
      await refresh();
      return updated;
    } catch (err) {
      console.error("Ошибка при смене статуса баннера:", err);
      setError("Не удалось обновить статус баннера");
      return null;
    }
  }, [refresh]);

  const goToPage = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  return {
    rawBanners: banners,
    banners: filteredBanners,
    loading,
    error,
    page,
    totalPages,
    totalElements,
    searchTerm,
    setSearchTerm,
    refresh,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleStatus,
    goToPage,
  };
};
