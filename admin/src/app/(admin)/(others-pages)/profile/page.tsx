import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ProfileOverview from "@/components/user-profile/ProfileOverview";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Мой профиль",
};

export default function Profile() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Мой профиль" />
      <ProfileOverview />
    </div>
  );
}
