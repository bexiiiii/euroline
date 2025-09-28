"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/authStore"
import { useState } from "react"
import { useRouter } from "next/navigation"

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    try {
      const success = await login(data.email, data.password)
      if (success) {
        toast.success("Вход выполнен успешно!")
        router.push('/') // Перенаправляем на главную страницу
      } else {
        toast.error("Неверный email или пароль")
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          "Произошла ошибка при входе"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6">
      <Link href="/">
        <Image
          src="https://via.placeholder.com/200x100?text=ЛОГО"
          alt="Логотип"
          width={200}
          height={100}
          className="opacity-90"
        />
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход в систему</CardTitle>
          <CardDescription>
            Введите ваши данные для входа в личный кабинет
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                {...register("email")} 
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input 
                type="password" 
                id="password" 
                {...register("password")} 
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="justify-center text-muted-foreground">
          Нет аккаунта? 
          <Link href="/auth/signup" className="ml-1 text-blue-600 cursor-pointer hover:underline">
            Зарегистрироваться
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
