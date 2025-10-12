"use client";
import React, { useState, useEffect, useCallback } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { logPageView } from "@/lib/eventLogger";
import { settingsApi } from "@/lib/api/settings";
import { useToast } from "@/context/ToastContext";

interface SiteSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
    currency: string;
  };
  appearance: {
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
    theme: "light" | "dark" | "auto";
    fontFamily: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    googleAnalytics: string;
    yandexMetrica: string;
    robotsTxt: string;
  };
  business: {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    workingHours: string;
    inn: string;
    kpp: string;
    ogrn: string;
  };
  social: {
    facebook: string;
    instagram: string;
    vkontakte: string;
    telegram: string;
    whatsapp: string;
    youtube: string;
  };
}

const SiteSettingsPage = () => {
  const { success: showSuccess, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState("general");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [settings, setSettings] = useState<SiteSettings>({
    general: {
      siteName: "",
      siteDescription: "",
      siteUrl: "",
      adminEmail: "",
      timezone: "Europe/Moscow",
      language: "ru",
      currency: "RUB"
    },
    appearance: {
      logo: "",
      favicon: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      theme: "light",
      fontFamily: "Inter"
    },
    seo: {
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      googleAnalytics: "",
      yandexMetrica: "",
      robotsTxt: "User-agent: *\nDisallow: /admin/\nDisallow: /api/"
    },
    business: {
      companyName: "",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      workingHours: "",
      inn: "",
      kpp: "",
      ogrn: ""
    },
    social: {
      facebook: "",
      instagram: "",
      vkontakte: "",
      telegram: "",
      whatsapp: "",
      youtube: ""
    }
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const settingsArray = await settingsApi.list();
      const transformedSettings = transformSettingsData(settingsArray);
      setSettings(transformedSettings);
      setHasUnsavedChanges(false);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить настройки';
      setError(message);
      console.error('Failed to fetch settings:', err);
      showError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchSettings();
    logPageView('Настройки сайта', '/site-settings');
  }, [fetchSettings]);

  // Transform settings array from backend to our structure
  const transformSettingsData = (settingsArray: any[]): SiteSettings => {
    const settingsMap = new Map(settingsArray.map(s => [s.key, s.value]));
    
    return {
      general: {
        siteName: settingsMap.get('site.name') || 'Euroline',
        siteDescription: settingsMap.get('site.description') || '',
        siteUrl: settingsMap.get('site.url') || '',
        adminEmail: settingsMap.get('site.admin_email') || '',
        timezone: settingsMap.get('site.timezone') || 'Europe/Moscow',
        language: settingsMap.get('site.language') || 'ru',
        currency: settingsMap.get('site.currency') || 'RUB'
      },
      appearance: {
        logo: settingsMap.get('appearance.logo') || '',
        favicon: settingsMap.get('appearance.favicon') || '',
        primaryColor: settingsMap.get('appearance.primary_color') || '#3B82F6',
        secondaryColor: settingsMap.get('appearance.secondary_color') || '#10B981',
        theme: (settingsMap.get('appearance.theme') as any) || 'light',
        fontFamily: settingsMap.get('appearance.font_family') || 'Inter'
      },
      seo: {
        metaTitle: settingsMap.get('seo.meta_title') || '',
        metaDescription: settingsMap.get('seo.meta_description') || '',
        metaKeywords: settingsMap.get('seo.meta_keywords') || '',
        googleAnalytics: settingsMap.get('seo.google_analytics') || '',
        yandexMetrica: settingsMap.get('seo.yandex_metrica') || '',
        robotsTxt: settingsMap.get('seo.robots_txt') || 'User-agent: *\nDisallow: /admin/\nDisallow: /api/'
      },
      business: {
        companyName: settingsMap.get('business.company_name') || '',
        companyAddress: settingsMap.get('business.company_address') || '',
        companyPhone: settingsMap.get('business.company_phone') || '',
        companyEmail: settingsMap.get('business.company_email') || '',
        workingHours: settingsMap.get('business.working_hours') || '',
        inn: settingsMap.get('business.inn') || '',
        kpp: settingsMap.get('business.kpp') || '',
        ogrn: settingsMap.get('business.ogrn') || ''
      },
      social: {
        facebook: settingsMap.get('social.facebook') || '',
        instagram: settingsMap.get('social.instagram') || '',
        vkontakte: settingsMap.get('social.vkontakte') || '',
        telegram: settingsMap.get('social.telegram') || '',
        whatsapp: settingsMap.get('social.whatsapp') || '',
        youtube: settingsMap.get('social.youtube') || ''
      }
    };
  };

  const timezoneOptions = [
    { value: "Europe/Moscow", label: "Москва (UTC+3)" },
    { value: "Europe/Samara", label: "Самара (UTC+4)" },
    { value: "Asia/Yekaterinburg", label: "Екатеринбург (UTC+5)" },
    { value: "Asia/Omsk", label: "Омск (UTC+6)" },
    { value: "Asia/Krasnoyarsk", label: "Красноярск (UTC+7)" },
    { value: "Asia/Irkutsk", label: "Иркутск (UTC+8)" },
    { value: "Asia/Vladivostok", label: "Владивосток (UTC+10)" }
  ];

  const languageOptions = [
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" }
  ];

  const currencyOptions = [
    { value: "RUB", label: "Российский рубль (₽)" },
    { value: "USD", label: "Доллар США ($)" },
    { value: "EUR", label: "Евро (€)" }
  ];

  const themeOptions = [
    { value: "light", label: "Светлая" },
    { value: "dark", label: "Темная" },
    { value: "auto", label: "Системная" }
  ];

  const updateSetting = (section: keyof SiteSettings, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const settingsToSave = [
        // General settings
        { key: 'site.name', value: settings.general.siteName },
        { key: 'site.description', value: settings.general.siteDescription },
        { key: 'site.url', value: settings.general.siteUrl },
        { key: 'site.admin_email', value: settings.general.adminEmail },
        { key: 'site.timezone', value: settings.general.timezone },
        { key: 'site.language', value: settings.general.language },
        { key: 'site.currency', value: settings.general.currency },
        
        // Appearance settings
        { key: 'appearance.logo', value: settings.appearance.logo },
        { key: 'appearance.favicon', value: settings.appearance.favicon },
        { key: 'appearance.primary_color', value: settings.appearance.primaryColor },
        { key: 'appearance.secondary_color', value: settings.appearance.secondaryColor },
        { key: 'appearance.theme', value: settings.appearance.theme },
        { key: 'appearance.font_family', value: settings.appearance.fontFamily },
        
        // SEO settings
        { key: 'seo.meta_title', value: settings.seo.metaTitle },
        { key: 'seo.meta_description', value: settings.seo.metaDescription },
        { key: 'seo.meta_keywords', value: settings.seo.metaKeywords },
        { key: 'seo.google_analytics', value: settings.seo.googleAnalytics },
        { key: 'seo.yandex_metrica', value: settings.seo.yandexMetrica },
        { key: 'seo.robots_txt', value: settings.seo.robotsTxt },
        
        // Business settings
        { key: 'business.company_name', value: settings.business.companyName },
        { key: 'business.company_address', value: settings.business.companyAddress },
        { key: 'business.company_phone', value: settings.business.companyPhone },
        { key: 'business.company_email', value: settings.business.companyEmail },
        { key: 'business.working_hours', value: settings.business.workingHours },
        { key: 'business.inn', value: settings.business.inn },
        { key: 'business.kpp', value: settings.business.kpp },
        { key: 'business.ogrn', value: settings.business.ogrn },
        
        // Social settings
        { key: 'social.facebook', value: settings.social.facebook },
        { key: 'social.instagram', value: settings.social.instagram },
        { key: 'social.vkontakte', value: settings.social.vkontakte },
        { key: 'social.telegram', value: settings.social.telegram },
        { key: 'social.whatsapp', value: settings.social.whatsapp },
        { key: 'social.youtube', value: settings.social.youtube },
      ];

      await settingsApi.updateBulk(settingsToSave.map(setting => ({
        key: setting.key,
        value: setting.value,
      })));

      setHasUnsavedChanges(false);
      showSuccess('Настройки успешно сохранены');
      await fetchSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setIsModalOpen(true);
  };

  const confirmReset = async () => {
    try {
      setResetLoading(true);
      await settingsApi.reset();
      await fetchSettings();
      setHasUnsavedChanges(false);
      showSuccess('Настройки сброшены к значениям по умолчанию');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      showError('Не удалось сбросить настройки');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">Загрузка настроек...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-red-500 dark:text-red-400">
            <p className="text-lg font-medium">Ошибка загрузки: {error}</p>
            <button 
              onClick={() => fetchSettings()} 
              className="mt-2 text-sm underline hover:no-underline"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      ) : (
        <>
      {/* Уведомление о несохраненных изменениях */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800 dark:text-yellow-200">
                У вас есть несохраненные изменения
              </span>
            </div>
            <div className="flex space-x-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  fetchSettings();
                  setHasUnsavedChanges(false);
                }}
                disabled={saving}
              >
                Отменить
              </Button>
              <Button size="sm" onClick={saveSettings} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Основной контент */}
      <ComponentCard
        title="Настройки сайта"
        description="Конфигурация основных параметров сайта"
        action={
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={resetSettings} disabled={saving || resetLoading}>
              Сбросить
            </Button>
            <Button size="sm" onClick={saveSettings} disabled={!hasUnsavedChanges || saving}>
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        }
      >
        {/* Табы */}
        <div className="border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {[
              { id: "general", name: "Общие" },
              { id: "appearance", name: "Внешний вид" },
              { id: "seo", name: "SEO" },
              { id: "business", name: "Организация" },
              { id: "social", name: "Соц. сети" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Контент табов */}
        <div className="mt-6">
          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Название сайта</Label>
                <Input
                  value={settings.general.siteName}
                  onChange={(e) => updateSetting("general", "siteName", e.target.value)}
                  placeholder="Введите название сайта"
                />
              </div>
              <div>
                <Label>URL сайта</Label>
                <Input
                  value={settings.general.siteUrl}
                  onChange={(e) => updateSetting("general", "siteUrl", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Описание сайта</Label>
                <textarea
                  value={settings.general.siteDescription}
                  onChange={(e) => updateSetting("general", "siteDescription", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Краткое описание сайта"
                />
              </div>
              <div>
                <Label>Email администратора</Label>
                <Input
                  type="email"
                  value={settings.general.adminEmail}
                  onChange={(e) => updateSetting("general", "adminEmail", e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label>Часовой пояс</Label>
                <Select
                  options={timezoneOptions}
                  value={settings.general.timezone}
                  onChange={(value) => updateSetting("general", "timezone", value)}
                  placeholder="Выберите часовой пояс"
                />
              </div>
              <div>
                <Label>Язык по умолчанию</Label>
                <Select
                  options={languageOptions}
                  value={settings.general.language}
                  onChange={(value) => updateSetting("general", "language", value)}
                  placeholder="Выберите язык"
                />
              </div>
              <div>
                <Label>Валюта</Label>
                <Select
                  options={currencyOptions}
                  value={settings.general.currency}
                  onChange={(value) => updateSetting("general", "currency", value)}
                  placeholder="Выберите валюту"
                />
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Логотип сайта</Label>
                <Input
                  value={settings.appearance.logo}
                  onChange={(e) => updateSetting("appearance", "logo", e.target.value)}
                  placeholder="/images/logo.svg"
                />
              </div>
              <div>
                <Label>Фавикон</Label>
                <Input
                  value={settings.appearance.favicon}
                  onChange={(e) => updateSetting("appearance", "favicon", e.target.value)}
                  placeholder="/images/favicon.ico"
                />
              </div>
              <div>
                <Label>Основной цвет</Label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    value={settings.appearance.primaryColor}
                    onChange={(e) => updateSetting("appearance", "primaryColor", e.target.value)}
                    className="w-16"
                  />
                  <Input
                    value={settings.appearance.primaryColor}
                    onChange={(e) => updateSetting("appearance", "primaryColor", e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Дополнительный цвет</Label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    value={settings.appearance.secondaryColor}
                    onChange={(e) => updateSetting("appearance", "secondaryColor", e.target.value)}
                    className="w-16"
                  />
                  <Input
                    value={settings.appearance.secondaryColor}
                    onChange={(e) => updateSetting("appearance", "secondaryColor", e.target.value)}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Тема оформления</Label>
                <Select
                  options={themeOptions}
                  value={settings.appearance.theme}
                  onChange={(value) => updateSetting("appearance", "theme", value)}
                  placeholder="Выберите тему"
                />
              </div>
              <div>
                <Label>Шрифт</Label>
                <Input
                  value={settings.appearance.fontFamily}
                  onChange={(e) => updateSetting("appearance", "fontFamily", e.target.value)}
                  placeholder="Inter, Arial, sans-serif"
                />
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-6">
              <div>
                <Label>Meta Title</Label>
                <Input
                  value={settings.seo.metaTitle}
                  onChange={(e) => updateSetting("seo", "metaTitle", e.target.value)}
                  placeholder="Заголовок для поисковых систем"
                />
              </div>
              <div>
                <Label>Meta Description</Label>
                <textarea
                  value={settings.seo.metaDescription}
                  onChange={(e) => updateSetting("seo", "metaDescription", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Описание для поисковых систем"
                />
              </div>
              <div>
                <Label>Ключевые слова</Label>
                <Input
                  value={settings.seo.metaKeywords}
                  onChange={(e) => updateSetting("seo", "metaKeywords", e.target.value)}
                  placeholder="ключевое слово 1, ключевое слово 2"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Google Analytics ID</Label>
                  <Input
                    value={settings.seo.googleAnalytics}
                    onChange={(e) => updateSetting("seo", "googleAnalytics", e.target.value)}
                    placeholder="GA_MEASUREMENT_ID"
                  />
                </div>
                <div>
                  <Label>Яндекс.Метрика ID</Label>
                  <Input
                    value={settings.seo.yandexMetrica}
                    onChange={(e) => updateSetting("seo", "yandexMetrica", e.target.value)}
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div>
                <Label>Robots.txt</Label>
                <textarea
                  value={settings.seo.robotsTxt}
                  onChange={(e) => updateSetting("seo", "robotsTxt", e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Содержимое файла robots.txt"
                />
              </div>
            </div>
          )}

          {activeTab === "business" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Название организации</Label>
                <Input
                  value={settings.business.companyName}
                  onChange={(e) => updateSetting("business", "companyName", e.target.value)}
                  placeholder='ООО "Название компании"'
                />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input
                  value={settings.business.companyPhone}
                  onChange={(e) => updateSetting("business", "companyPhone", e.target.value)}
                  placeholder="+7 (495) 123-45-67"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Адрес</Label>
                <Input
                  value={settings.business.companyAddress}
                  onChange={(e) => updateSetting("business", "companyAddress", e.target.value)}
                  placeholder="г. Город, ул. Улица, д. Дом"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settings.business.companyEmail}
                  onChange={(e) => updateSetting("business", "companyEmail", e.target.value)}
                  placeholder="info@company.ru"
                />
              </div>
              <div>
                <Label>Часы работы</Label>
                <Input
                  value={settings.business.workingHours}
                  onChange={(e) => updateSetting("business", "workingHours", e.target.value)}
                  placeholder="Пн-Пт: 9:00-18:00"
                />
              </div>
              <div>
                <Label>ИНН</Label>
                <Input
                  value={settings.business.inn}
                  onChange={(e) => updateSetting("business", "inn", e.target.value)}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <Label>КПП</Label>
                <Input
                  value={settings.business.kpp}
                  onChange={(e) => updateSetting("business", "kpp", e.target.value)}
                  placeholder="123456789"
                />
              </div>
              <div className="md:col-span-2">
                <Label>ОГРН</Label>
                <Input
                  value={settings.business.ogrn}
                  onChange={(e) => updateSetting("business", "ogrn", e.target.value)}
                  placeholder="1234567890123"
                />
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Facebook</Label>
                <Input
                  value={settings.social.facebook}
                  onChange={(e) => updateSetting("social", "facebook", e.target.value)}
                  placeholder="https://facebook.com/username"
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={settings.social.instagram}
                  onChange={(e) => updateSetting("social", "instagram", e.target.value)}
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div>
                <Label>ВКонтакте</Label>
                <Input
                  value={settings.social.vkontakte}
                  onChange={(e) => updateSetting("social", "vkontakte", e.target.value)}
                  placeholder="https://vk.com/username"
                />
              </div>
              <div>
                <Label>Telegram</Label>
                <Input
                  value={settings.social.telegram}
                  onChange={(e) => updateSetting("social", "telegram", e.target.value)}
                  placeholder="https://t.me/username"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={settings.social.whatsapp}
                  onChange={(e) => updateSetting("social", "whatsapp", e.target.value)}
                  placeholder="+7 (495) 123-45-67"
                />
              </div>
              <div>
                <Label>YouTube</Label>
                <Input
                  value={settings.social.youtube}
                  onChange={(e) => updateSetting("social", "youtube", e.target.value)}
                  placeholder="https://youtube.com/c/username"
                />
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Модальное окно подтверждения сброса */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Сброс настроек
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Вы уверены, что хотите сбросить все настройки к значениям по умолчанию? 
            Это действие нельзя отменить.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={resetLoading}
            >
              Отменить
            </Button>
            <Button
              variant="primary"
              className="!bg-red-600 hover:!bg-red-700"
              onClick={confirmReset}
              disabled={resetLoading}
            >
              {resetLoading ? "Сбрасываем..." : "Сбросить"}
            </Button>
          </div>
        </div>
      </Modal>
        </>
      )}
    </div>
  );
};

export default SiteSettingsPage;
