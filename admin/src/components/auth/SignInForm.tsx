"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import React, { useState } from "react";
import { useAuthContext } from "@/context/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login, loading } = useAuthContext();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Введите эл. почту и пароль");
      return;
    }

    try {
      const success = await login(email.trim(), password);
      if (!success) {
        setError("Неверная эл. почта или пароль");
        return;
      }
      // Если контекст не перенаправил сам, уходим на главную вручную
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "Не удалось войти. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 sm:px-0">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Вход в админ-панель
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Войдите с учётной записью администратора Euroline.
          </p>
        </div>
        <form onSubmit={onSubmit} noValidate>
          <div className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
              >
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="signin-email">
                Эл. почта <span className="text-error-500">*</span>
              </Label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                placeholder="admin@euroline.kz"
                defaultValue={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="signin-password">
                Пароль <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  defaultValue={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <Button className="w-full" size="sm" disabled={loading} type="submit">
              {loading ? "Входим…" : "Войти"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
