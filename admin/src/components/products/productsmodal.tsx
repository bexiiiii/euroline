"use client";
import React, { useEffect, useMemo, useState } from "react";

import { useModal } from "@/hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { productApi } from "@/lib/api/products";
import { categoriesApi, type Category } from "@/lib/api/categories";

type SubcatOption = { id: number; name: string; slug: string };

interface ProductsModalProps {
  onCreated?: () => void;
}

export default function ProductsModal({ onCreated }: ProductsModalProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    brand: "",
    description: "",
    subcategoryId: "",
    subcategorySlug: "",
    subcategoryName: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [tree, setTree] = useState<Category[]>([]);
  const [parentId, setParentId] = useState<number | "">("");
  const [subId, setSubId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // load categories tree for subcategory selection (best-effort)
  useEffect(() => {
    (async () => {
      try {
        const t = await categoriesApi.getCategoryTree();
        setTree(t);
      } catch {
        setTree([]);
      }
    })();
  }, []);

  const parentOptions = useMemo(() => tree.map(c => ({ id: c.id, name: c.name })), [tree]);
  const subOptions = useMemo<SubcatOption[]>(() => {
    const parent = tree.find(c => c.id === parentId);
    const subs = parent?.subcategories || [];
    return subs.map(sc => ({ id: sc.id, name: sc.name, slug: sc.slug }));
  }, [tree, parentId]);

  const resetForm = () => {
    setFormData({ name: "", sku: "", brand: "", description: "", subcategoryId: "", subcategorySlug: "", subcategoryName: "" });
    setParentId("");
    setSubId("");
    setImageFile(null);
    setImagePreview("");
    setError(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.sku.trim()) {
        setError("Название и артикул обязательны");
        return;
      }
      setSaving(true);
      setError(null);

      // Upload image if provided
      let imageUrl = "";
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const uploadRes = await fetch(`/api/images/upload`, {
          method: 'POST',
          body: fd,
          headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}` },
        });
        if (!uploadRes.ok) throw new Error('Не удалось загрузить изображение');
        const body = await uploadRes.json();
        imageUrl = body.url || "";
      }

      // Build properties with selected subcategory
      const properties = [] as { propertyName: string; propertyValue: string }[];
      if (subId && subOptions.length) {
        const chosen = subOptions.find(s => s.id === subId);
        if (chosen) {
          properties.push({ propertyName: 'subcategoryId', propertyValue: String(chosen.id) });
          properties.push({ propertyName: 'subcategorySlug', propertyValue: chosen.slug });
          properties.push({ propertyName: 'subcategoryName', propertyValue: chosen.name });
        }
      }

      // Create product in backend; brand left blank, externalCode=sku. 1C data will enrich on reads.
      const brand = formData.brand.trim() || "Без бренда";
      const sku = formData.sku.trim();

      await productApi.createProduct({
        name: formData.name.trim(),
        code: sku,
        description: formData.description?.trim() || "",
        brand,
        externalCode: sku,
        imageUrl,
        properties,
      });

      alert("Товар успешно добавлен и будет синхронизирован с 1С по артикулу.");
      closeModal();
      resetForm();
      onCreated?.();
    } catch (e: any) {
      setError(e?.message || 'Ошибка при сохранении товара');
    } finally {
      setSaving(false);
    }
  };

  // old categories removed; using subcategory selection fed by category tree

  return (
  <>
      <Button size="sm" onClick={openModal}>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Добавить товар
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[800px] p-5 lg:p-8"
      >
        <form className="">
          <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Добавить новый товар
          </h4>

          {error && (
            <div className="mb-4 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="col-span-1 sm:col-span-2">
              <Label>Название товара *</Label>
              <Input 
                type="text" 
                placeholder="Например: Фильтр масляный MANN W 712/75"
                defaultValue={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="col-span-1">
              <Label>Артикул (SKU) *</Label>
              <Input 
                type="text" 
                placeholder="MANN-W712-75"
                defaultValue={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
              />
            </div>

            <div className="col-span-1">
              <Label>Бренд *</Label>
              <Input
                type="text"
                placeholder="Например: MANN"
                defaultValue={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
              />
            </div>

            {/* Subcategory selection (parent -> subcategory) */}
            <div className="col-span-1">
              <Label>Категория</Label>
              <select
                value={parentId as any}
                onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ""; setParentId(v); setSubId(""); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">Выберите категорию</option>
                {parentOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <Label>Подкатегория</Label>
              <select
                value={subId as any}
                onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ""; setSubId(v); const chosen = subOptions.find(s=>s.id===Number(e.target.value)); handleInputChange('subcategoryId', e.target.value); handleInputChange('subcategorySlug', chosen?.slug || ''); handleInputChange('subcategoryName', chosen?.name || ''); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                disabled={!parentId || subOptions.length===0}
              >
                <option value="">{parentId ? (subOptions.length ? 'Выберите подкатегорию' : 'Подкатегории не найдены') : 'Сначала выберите категорию'}</option>
                {subOptions.map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
            </div>

            {/* Image upload */}
            <div className="col-span-1 sm:col-span-2">
              <Label>Изображение товара</Label>
              <div className="flex items-center gap-4">
                <Input type="file" onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setImageFile(f);
                  if (f) setImagePreview(URL.createObjectURL(f)); else setImagePreview("");
                }} />
                {imagePreview && (
                  <img src={imagePreview} alt="preview" className="h-16 w-16 rounded object-cover border" />
                )}
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <Label>Описание</Label>
              <textarea
                placeholder="Подробное описание товара..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end w-full gap-3 mt-8">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.sku.trim()}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {saving ? 'Сохранение...' : 'Сохранить товар'}
            </Button>
          </div>
        </form>
      </Modal>
   </>
  );
}
