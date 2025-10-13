import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Euroline.kz Админ Панель - Вход",
  description: "Это страница входа в админ панель Euroline.kz",
};

export default function SignIn() {
  return <SignInForm />;
}
