import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в админ-панель Euroline",
};

export default function SignIn() {
  return <SignInForm />;
}
