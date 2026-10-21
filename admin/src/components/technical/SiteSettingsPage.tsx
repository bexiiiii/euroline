"use client";
import React, { useState, useEffect, useCallback } from "react";
import Button from "../ui/button/Button";
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
      timezone: "Asia/Almaty",
      language: "ru",
      currency: "KZT"
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
      setError('Не удалось загрузить настройки');
      console.error('Failed to fetch settings:', err);
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
        timezone: settingsMap.get('site.timezone') || 'Asia/Almaty',
        language: settingsMap.get('site.language') || 'ru',
        currency: settingsMap.get('site.currency') || 'KZT'
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
    { value: "Asia/Almaty", label: "Алматы, Астана (UTC+5)" },
    { value: "Asia/Aqtobe", label: "Актобе (UTC+5)" },
    { value: "Asia/Oral", label: "Уральск (UTC+5)" },
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
    { value: "KZT", label: "Казахстанский тенге (₸)" },
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
      showSuccess('Настройки сохранены');
      await fetchSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Не удалось сохранить настройки');
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
      showSuccess('Настройки сброшены');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      showError('Не удалось сбросить настройки');
    } finally {
      setResetLoading(false);
    }
  };

  const textareaClass =
    "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-error-600 dark:text-error-400">Не удалось загрузить данные</p>
        <Button size="xs" variant="outline" className="mt-3" onClick={() => fetchSettings()}>
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {hasUnsavedChanges && (
          <span className="text-sm text-warning-600 dark:text-warning-400">Есть несохранённые изменения</span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-10! py-0!"
            onClick={resetSettings}
            disabled={saving || resetLoading}
          >
            Сбросить по умолчанию
          </Button>
          {hasUnsavedChanges && (
            <Button
              size="sm"
              variant="outline"
              className="h-10! py-0!"
              onClick={() => fetchSettings()}
              disabled={saving}
            >
              Отменить
            </Button>
          )}
          <Button size="sm" className="h-10! py-0!" onClick={saveSettings} disabled={!hasUnsavedChanges || saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      <Section title="Общие">
        <Field label="Название сайта">
          <Input
                value={settings.general.siteName}
                onChange={(e) => updateSetting("general", "siteName", e.target.value)}
                placeholder="Euroline"
              />
        </Field>
        <Field label="Адрес сайта">
          <Input
                value={settings.general.siteUrl}
                onChange={(e) => updateSetting("general", "siteUrl", e.target.value)}
                placeholder="https://euroline.kz"
              />
        </Field>
        <Field label="Описание" wide>
          <textarea
            value={settings.general.siteDescription}
            onChange={(e) => updateSetting("general", "siteDescription", e.target.value)}
            rows={2}
            className={textareaClass}
          />
        </Field>
        <Field label="Email администратора">
          <Input
                type="email"
                value={settings.general.adminEmail}
                onChange={(e) => updateSetting("general", "adminEmail", e.target.value)}
                placeholder="admin@euroline.kz"
              />
        </Field>
        <Field label="Часовой пояс">
          <Select
            options={timezoneOptions}
            value={settings.general.timezone}
            onChange={(value) => updateSetting("general", "timezone", value)}
            placeholder="Часовой пояс"
          />
        </Field>
        <Field label="Язык">
          <Select
            options={languageOptions}
            value={settings.general.language}
            onChange={(value) => updateSetting("general", "language", value)}
            placeholder="Язык"
          />
        </Field>
        <Field label="Валюта">
          <Select
            options={currencyOptions}
            value={settings.general.currency}
            onChange={(value) => updateSetting("general", "currency", value)}
            placeholder="Валюта"
          />
        </Field>
      </Section>

      <Section title="Организация">
        <Field label="Название">
          <Input
                value={settings.business.companyName}
                onChange={(e) => updateSetting("business", "companyName", e.target.value)}
                placeholder="ТОО «Euroline»"
              />
        </Field>
        <Field label="Телефон">
          <Input
                value={settings.business.companyPhone}
                onChange={(e) => updateSetting("business", "companyPhone", e.target.value)}
                placeholder="+7 (727) 000-00-00"
              />
        </Field>
        <Field label="Адрес" wide>
          <Input
                value={settings.business.companyAddress}
                onChange={(e) => updateSetting("business", "companyAddress", e.target.value)}
                placeholder="г. Алматы, ул. ..."
              />
        </Field>
        <Field label="Email">
          <Input
                type="email"
                value={settings.business.companyEmail}
                onChange={(e) => updateSetting("business", "companyEmail", e.target.value)}
                placeholder="info@euroline.kz"
              />
        </Field>
        <Field label="Часы работы">
          <Input
                value={settings.business.workingHours}
                onChange={(e) => updateSetting("business", "workingHours", e.target.value)}
                placeholder="Пн-Пт 9:00-18:00"
              />
        </Field>
        <Field label="ИНН">
          <Input
                value={settings.business.inn}
                onChange={(e) => updateSetting("business", "inn", e.target.value)}
              />
        </Field>
        <Field label="КПП">
          <Input
                value={settings.business.kpp}
                onChange={(e) => updateSetting("business", "kpp", e.target.value)}
              />
        </Field>
        <Field label="ОГРН">
          <Input
                value={settings.business.ogrn}
                onChange={(e) => updateSetting("business", "ogrn", e.target.value)}
              />
        </Field>
      </Section>

      <Section title="Соцсети">
        <Field label="Instagram">
          <Input
                value={settings.social.instagram}
                onChange={(e) => updateSetting("social", "instagram", e.target.value)}
                placeholder="https://instagram.com/..."
              />
        </Field>
        <Field label="Telegram">
          <Input
                value={settings.social.telegram}
                onChange={(e) => updateSetting("social", "telegram", e.target.value)}
                placeholder="https://t.me/..."
              />
        </Field>
        <Field label="WhatsApp">
          <Input
                value={settings.social.whatsapp}
                onChange={(e) => updateSetting("social", "whatsapp", e.target.value)}
                placeholder="+7 700 000 00 00"
              />
        </Field>
        <Field label="YouTube">
          <Input
                value={settings.social.youtube}
                onChange={(e) => updateSetting("social", "youtube", e.target.value)}
                placeholder="https://youtube.com/..."
              />
        </Field>
        <Field label="Facebook">
          <Input
                value={settings.social.facebook}
                onChange={(e) => updateSetting("social", "facebook", e.target.value)}
                placeholder="https://facebook.com/..."
              />
        </Field>
        <Field label="ВКонтакте">
          <Input
                value={settings.social.vkontakte}
                onChange={(e) => updateSetting("social", "vkontakte", e.target.value)}
                placeholder="https://vk.com/..."
              />
        </Field>
      </Section>

      <Section title="SEO">
        <Field label="Заголовок" wide>
          <Input
                value={settings.seo.metaTitle}
                onChange={(e) => updateSetting("seo", "metaTitle", e.target.value)}
              />
        </Field>
        <Field label="Описание" wide>
          <textarea
            value={settings.seo.metaDescription}
            onChange={(e) => updateSetting("seo", "metaDescription", e.target.value)}
            rows={2}
            className={textareaClass}
          />
        </Field>
        <Field label="Ключевые слова" wide>
          <Input
                value={settings.seo.metaKeywords}
                onChange={(e) => updateSetting("seo", "metaKeywords", e.target.value)}
              />
        </Field>
        <Field label="Google Analytics ID">
          <Input
                value={settings.seo.googleAnalytics}
                onChange={(e) => updateSetting("seo", "googleAnalytics", e.target.value)}
                placeholder="G-XXXXXXX"
              />
        </Field>
        <Field label="Яндекс Метрика ID">
          <Input
                value={settings.seo.yandexMetrica}
                onChange={(e) => updateSetting("seo", "yandexMetrica", e.target.value)}
              />
        </Field>
        <Field label="robots.txt" wide>
          <textarea
            value={settings.seo.robotsTxt}
            onChange={(e) => updateSetting("seo", "robotsTxt", e.target.value)}
            rows={4}
            className={`${textareaClass} font-mono`}
          />
        </Field>
      </Section>

      <Section title="Внешний вид">
        <Field label="Логотип">
          <Input
                value={settings.appearance.logo}
                onChange={(e) => updateSetting("appearance", "logo", e.target.value)}
                placeholder="/images/logo.svg"
              />
        </Field>
        <Field label="Фавикон">
          <Input
                value={settings.appearance.favicon}
                onChange={(e) => updateSetting("appearance", "favicon", e.target.value)}
                placeholder="/favicon.ico"
              />
        </Field>
        <Field label="Основной цвет">
          <div className="flex gap-2">
            <div className="w-14 shrink-0">
              <Input
                type="color"
                value={settings.appearance.primaryColor}
                onChange={(e) => updateSetting("appearance", "primaryColor", e.target.value)}
                className="px-1!"
              />
            </div>
            <div className="flex-1">
              <Input
                value={settings.appearance.primaryColor}
                onChange={(e) => updateSetting("appearance", "primaryColor", e.target.value)}
                placeholder="#3B82F6"
              />
            </div>
          </div>
        </Field>
        <Field label="Дополнительный цвет">
          <div className="flex gap-2">
            <div className="w-14 shrink-0">
              <Input
                type="color"
                value={settings.appearance.secondaryColor}
                onChange={(e) => updateSetting("appearance", "secondaryColor", e.target.value)}
                className="px-1!"
              />
            </div>
            <div className="flex-1">
              <Input
                value={settings.appearance.secondaryColor}
                onChange={(e) => updateSetting("appearance", "secondaryColor", e.target.value)}
                placeholder="#10B981"
              />
            </div>
          </div>
        </Field>
        <Field label="Тема">
          <Select
            options={themeOptions}
            value={settings.appearance.theme}
            onChange={(value) => updateSetting("appearance", "theme", value)}
            placeholder="Тема"
          />
        </Field>
        <Field label="Шрифт">
          <Input
                value={settings.appearance.fontFamily}
                onChange={(e) => updateSetting("appearance", "fontFamily", e.target.value)}
                placeholder="Inter"
              />
        </Field>
      </Section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <div className="space-y-4 p-5">
          <h3 className="pr-8 text-base font-semibold text-gray-800 dark:text-white/90">Сбросить настройки?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Все параметры вернутся к значениям по умолчанию. Отменить это нельзя.
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)} disabled={resetLoading}>
              Отмена
            </Button>
            <Button
              size="sm"
              className="bg-error-500! hover:bg-error-600!"
              onClick={confirmReset}
              disabled={resetLoading}
            >
              {resetLoading ? "Сброс..." : "Сбросить"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-5">
    <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>
  </section>
);

const Field: React.FC<{ label: string; wide?: boolean; children: React.ReactNode }> = ({
  label,
  wide,
  children,
}) => (
  <div className={wide ? "lg:col-span-2" : undefined}>
    <Label>{label}</Label>
    {children}
  </div>
);

export default SiteSettingsPage;
