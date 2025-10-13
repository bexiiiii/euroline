import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админ панель Euroline.kz - Регистрация",
  description: "Это страница регистрации в админ панель Euroline.kz",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
