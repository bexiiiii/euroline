"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("admin@autoparts.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login, loading } = useAuthContext();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setError(null);
    
    console.log("Отправка формы входа с учетными данными:", { email, password: '***' }); // Debug log
    
    try {
      // Используем метод login из контекста аутентификации
      const success = await login(email, password);
      console.log("Результат входа:", success);
      
      if (!success) {
        setError("Неверный email или пароль");
        return;
      }
      
      // Если вход успешен, но перенаправление не произошло автоматически,
      // выполняем ручное перенаправление через window.location
      console.log("Вход успешен, выполняем перенаправление...");
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err: any) {
      console.error("Ошибка входа:", err);
      setError(err.message || "Ошибка входа");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Войти в аккаунт
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Введите свой email и пароль для входа!
            </p>
          </div>
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              
              
            </div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                
              </div>
            </div>
            <form onSubmit={onSubmit}>
              <div className="space-y-6">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {error}
                  </div>
                )}
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="info@gmail.com"
                    type="email"
                    defaultValue={email}
                    onChange={(e) => setEmail(e.target.value)}
                    /* library Input doesn’t support controlled value prop */
                  />
                </div>
                <div>
                  <Label>
                    пароль <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Введите ваш пароль"
                      defaultValue={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Запомнить меня
                    </span>
                  </div>
                 
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>

            
          </div>
        </div>
      </div>
    </div>
  );
}
