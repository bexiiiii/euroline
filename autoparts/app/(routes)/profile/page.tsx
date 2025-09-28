"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/textfield";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/lib/stores/authStore";
import { useProfileStore } from "@/lib/stores/profileStore";
import { useEffect } from "react";
import { toast } from "sonner";

const profileSchema = z.object({
  lastName: z.string().min(1, "Введите фамилию"),
  firstName: z.string().min(1, "Введите имя"),
  middleName: z.string().optional(),
  email: z.string().email("Неверный email"),
  phone: z.string().min(6, "Неверный номер телефона"),
  region: z.string().optional(),
  location: z.string().optional(),
  occupation: z.string().optional(),
  clientName: z.string().optional(),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(6, "Минимум 6 символов"),
  newPassword: z.string().min(6, "Минимум 6 символов"),
  confirmPassword: z.string().min(6, "Минимум 6 символов"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user, isAuthenticated } = useAuthStore();
  const { profile, isLoading, isUpdating, fetchProfile, updateProfile, changePassword } = useProfileStore();

  const profileForm = useForm<ProfileForm>({ 
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phone: '',
      region: '',
      location: '',
      occupation: '',
      clientName: '',
    }
  });
  
  const passwordForm = useForm<PasswordForm>({ 
    resolver: zodResolver(passwordSchema) 
  });

  // Загружаем профиль при монтировании
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  // Заполняем форму данными профиля
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.name || '',
        lastName: profile.surname || '',
        middleName: profile.fathername || '',
        email: profile.email || '',
        phone: profile.phone || '',
        region: profile.state || '',
        location: profile.city || '',
        occupation: profile.type || '',
        clientName: profile.clientName || '',
      });
    }
  }, [profile, profileForm]);

  const handlePersonalData = async (data: ProfileForm) => {
    const success = await updateProfile({
      name: data.firstName,
      surname: data.lastName,
      fathername: data.middleName,
    });

    if (success) {
      toast.success('Личные данные обновлены');
    }
  };

  const handleAccountData = async (data: ProfileForm) => {
    const success = await updateProfile({
      email: data.email,
      phone: data.phone,
    });

    if (success) {
      toast.success('Учетные данные обновлены');
    }
  };

  const handleDeliveryData = async (data: ProfileForm) => {
    const success = await updateProfile({
      state: data.region,
      city: data.location,
      type: data.occupation,
      clientName: data.clientName,
    });

    if (success) {
      toast.success('Данные доставки обновлены');
    }
  };

  const handlePasswordData = async (data: PasswordForm) => {
    const success = await changePassword({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });

    if (success) {
      passwordForm.reset();
      toast.success('Пароль изменен');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white min-h-screen pt-24">
        <main className="container mx-auto px-6">
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">Для доступа к профилю необходимо войти в систему</p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen pt-24">
        <main className="container mx-auto px-6">
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">Загрузка профиля...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <h1 className="text-4xl font-bold pt-10 pb-10 text-gray-800">Профиль</h1>

        {/* Личные данные */}
        <Section title="Личные данные">
          <form onSubmit={profileForm.handleSubmit(handlePersonalData)} className="space-y-6">
            <Field label="Фамилия" error={profileForm.formState.errors.lastName?.message}>
              <Input 
                {...profileForm.register("lastName")} 
                placeholder="Фамилия" 
                className="w-64" 
              />
            </Field>
            <Field label="Имя" error={profileForm.formState.errors.firstName?.message}>
              <Input 
                {...profileForm.register("firstName")} 
                placeholder="Имя" 
                className="w-64" 
              />
            </Field>
            <Field label="Отчество">
              <Input 
                {...profileForm.register("middleName")} 
                placeholder="Отчество" 
                className="w-64" 
              />
            </Field>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="bg-orange-500 w-xs text-white"
              >
                {isUpdating ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Section>

        {/* Учетные данные */}
        <Section title="Учетные данные">
          <form onSubmit={profileForm.handleSubmit(handleAccountData)} className="space-y-6">
            <Field label="Email" error={profileForm.formState.errors.email?.message}>
              <Input 
                {...profileForm.register("email")} 
                placeholder="Email" 
                className="w-64" 
              />
            </Field>
            <Field label="Номер телефона" error={profileForm.formState.errors.phone?.message}>
              <Input 
                {...profileForm.register("phone")} 
                placeholder="Телефон" 
                className="w-64" 
              />
            </Field>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="bg-orange-500 w-xs text-white"
              >
                {isUpdating ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Section>

        {/* Доставка */}
        <Section title="Доставка">
          <form onSubmit={profileForm.handleSubmit(handleDeliveryData)} className="space-y-6">
            <Field label="Территориальная единица">
              <Input 
                {...profileForm.register("region")} 
                placeholder="Территориальная единица" 
                className="w-64" 
              />
            </Field>
            <Field label="Местоположение офиса">
              <Input 
                {...profileForm.register("location")} 
                placeholder="Местоположение офиса" 
                className="w-64" 
              />
            </Field>
            <Field label="Вид деятельности">
              <Input 
                {...profileForm.register("occupation")} 
                placeholder="Вид деятельности" 
                className="w-64" 
              />
            </Field>
            <Field label="Наименование клиента">
              <Input 
                {...profileForm.register("clientName")} 
                placeholder="Наименование клиента" 
                className="w-64" 
              />
            </Field>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="bg-orange-500 w-xs text-white"
              >
                {isUpdating ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Section>

        {/* Изменение пароля */}
        <Section title="Изменение пароля">
          <form onSubmit={passwordForm.handleSubmit(handlePasswordData)} className="space-y-6">
            <Field label="Текущий пароль" error={passwordForm.formState.errors.oldPassword?.message}>
              <Input 
                {...passwordForm.register("oldPassword")} 
                placeholder="Текущий пароль" 
                type="password" 
                className="w-64" 
              />
            </Field>
            <Field label="Новый пароль" error={passwordForm.formState.errors.newPassword?.message}>
              <Input 
                {...passwordForm.register("newPassword")} 
                placeholder="Новый пароль" 
                type="password" 
                className="w-64" 
              />
            </Field>
            <Field label="Повторите новый пароль" error={passwordForm.formState.errors.confirmPassword?.message}>
              <Input 
                {...passwordForm.register("confirmPassword")} 
                placeholder="Повторите пароль" 
                type="password" 
                className="w-64" 
              />
            </Field>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="bg-orange-500 w-xs text-white"
              >
                {isUpdating ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-gray-100 p-8 rounded-lg border border-gray-300 mb-10">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
      <Label className="text-lg whitespace-nowrap min-w-[200px]">{label}</Label>
      <div className="flex flex-col gap-1">
        {children}
        {error && <span className="text-sm text-red-500 w-xs">{error}</span>}
      </div>
    </div>
  );
}
