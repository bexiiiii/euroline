import SiteSettingsPage from "@/components/technical/SiteSettingsPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Настройки сайта",
};

export default function SiteSettingsPageRoute() {
  return (
    <>
      <PageBreadcrumb pageTitle="Настройки сайта" />
      <SiteSettingsPage />
    </>
  );
}
