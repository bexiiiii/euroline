    // app/signup/page.tsx (или src/app/signup/page.tsx)
"use client"

import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { CountrySelect } from "@/components/CountrySelect"
import { ActivitySelect } from "@/components/ActivitySelect"
import { PhoneInputComponent } from "@/components/PhoneInputWithCountry"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { authApi, ApiError } from "@/lib/api/auth"
import { RegisterRequest } from "@/lib/types/auth"
import { useState } from "react"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  country: z.string().min(1, "Выберите страну"),
  region: z.string().min(2, "Введите регион"),
  location: z.string().min(2, "Введите местоположение офиса"),
  officeAddress: z.string().min(5, "Введите полный адрес офиса"),
  activity: z.string().min(1, "Выберите вид деятельности"),
  password: z.string().min(6, "Минимум 6 символов"),
  confirmPassword: z.string().min(6),
  surname: z.string().min(2, "Минимум 2 символа"),
  firstName: z.string().min(2, "Минимум 2 символа"),
  fathersName: z.string().min(2, "Минимум 2 символа"),
  email: z.string().email("Некорректный email"),
  phone: z.string().min(10, "Минимум 10 символов"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof formSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      country: "",
      region: "",
      location: "",
      officeAddress: "",
      activity: "",
      password: "",
      confirmPassword: "",
      surname: "",
      firstName: "",
      fathersName: "",
      email: "",
      phone: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    
    try {
      // Преобразуем данные формы в формат API
      const registerData: RegisterRequest = {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        clientName: data.name,
        country: data.country,
        state: data.region,
        city: data.location,
        officeAddress: data.officeAddress,
        type: data.activity,
        surname: data.surname,
        name: data.firstName,
        fathername: data.fathersName,
        phone: data.phone,
      }

      const response = await authApi.register(registerData)
      toast.success("Регистрация прошла успешно! Теперь вы можете войти в систему.")
      
      // Перенаправляем на страницу входа
      router.push('/auth/login')
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error('Ошибка регистрации. Попробуйте еще раз.')
      }
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

    return (
    <div className="flex flex-col items-center min-h-screen p-4 space-y-6">
  <Link href="/">
    <Image
      src="https://via.placeholder.com/200x100?text=ЛОГО"
      alt="Логотип"
      width={200}
      height={100}
       className="opacity-90"
    />
  </Link>

 
        <Card className="w-full max-w-6xl">
            
            <CardHeader>
            <CardTitle>Регистрация</CardTitle>
            <CardDescription>
                Электронная торговая площадка (ЭТП) предназначена для работы с ОПТОВЫМИ клиентами. Если Вы хотите приобретать товары в розницу, то обратитесь за информацией в контакт-центр.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                <Label htmlFor="name">Наименование клиента</Label>
                <Input id="name" {...register("name")} disabled={isLoading} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>

                <div>
                <Label>Страна</Label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <CountrySelect
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
                {errors.country && <p className="text-red-500 text-sm">{errors.country.message}</p>}
                </div>

                <div>
                <Label htmlFor="region">Территориальная единица</Label>
                <Input id="region" {...register("region")} disabled={isLoading} />
                {errors.region && <p className="text-red-500 text-sm">{errors.region.message}</p>}
                </div>
                <div>
                <Label htmlFor="location">Местоположение офиса</Label>
                <Input id="location" {...register("location")} disabled={isLoading} />
                {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                </div>
                
                <div>
                <Label htmlFor="officeAddress">Адрес офиса</Label>
                <Input id="officeAddress" {...register("officeAddress")} disabled={isLoading} placeholder="Улица, дом, офис" />
                {errors.officeAddress && <p className="text-red-500 text-sm">{errors.officeAddress.message}</p>}
                </div>
                
                <div>
                <Label>Вид деятельности</Label>
                <Controller
                  name="activity"
                  control={control}
                  render={({ field }) => (
                    <ActivitySelect
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
                {errors.activity && <p className="text-red-500 text-sm">{errors.activity.message}</p>}
                </div>
                <div>
                <Label htmlFor="surname">Фамилия</Label>
                <Input id="surname" {...register("surname")} disabled={isLoading} />
                {errors.surname && <p className="text-red-500 text-sm">{errors.surname.message}</p>}
                </div>
                <div>
                <Label htmlFor="firstName">Имя</Label>
                <Input id="firstName" {...register("firstName")} disabled={isLoading} />
                {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                </div>
                <div>
                <Label htmlFor="fathersName">Отчество</Label>
                <Input id="fathersName" {...register("fathersName")} disabled={isLoading} />
                {errors.fathersName && <p className="text-red-500 text-sm">{errors.fathersName.message}</p>}
                </div>
                <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...register("email")} disabled={isLoading} />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
                <div>
                <Label htmlFor="phone">Номер телефона</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInputComponent
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                </div>
                


                <div>
                <Label htmlFor="password">Пароль</Label>
                <Input type="password" id="password" {...register("password")} disabled={isLoading} />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>

                <div>
                <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
                <Input type="password" id="confirmPassword" {...register("confirmPassword")} disabled={isLoading} />
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
            </form>
            </CardContent>
            <CardFooter className="justify-center text-muted-foreground">
            Уже есть аккаунт? <Link href="/auth/login" className="ml-1 text-blue-600 cursor-pointer hover:underline">Войти</Link>
            </CardFooter>
        </Card>
        </div>
    )
    }
