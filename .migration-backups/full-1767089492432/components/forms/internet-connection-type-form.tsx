"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InternetConnectionType } from "@/lib/types";
import {
  createInternetConnectionType,
  updateInternetConnectionType,
} from "@/app/actions/internet-connections";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { FormWrapper, FormSection } from "@/components/ui/form-wrapper";
import { toast } from "sonner";

const formSchema = z.object({
  type: z.string().min(1, "Type is required"),
  speed: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  cost: z.coerce.number().nullable().optional(),
  created_at: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InternetConnectionTypeFormProps {
  initialData?: InternetConnectionType;
  onCreated?: (newType: InternetConnectionType) => void;
}

export function InternetConnectionTypeForm({
  initialData,
  onCreated,
}: InternetConnectionTypeFormProps) {
  const t = useTranslations('internetConnections');
  const locale = useLocale();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData?.type || "",
      speed: initialData?.speed || "",
      provider: initialData?.provider || "",
      status: initialData?.status || "",
      cost: initialData?.cost || 0,
      created_at: initialData?.created_at || new Date().toISOString(),
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (initialData) {
        const result = await updateInternetConnectionType(initialData.id, values);
        if (result.error) {
          toast.error(t('error'), {
            description: result.error
          });
          return;
        }
        toast.success(t('updateSuccess'));
      } else {
        const result = await createInternetConnectionType(
          values.type,
          values.speed,
          values.provider,
          values.status,
          values.cost
        );
        if (result.error) {
          toast.error(t('error'), {
            description: result.error
          });
          return;
        }
        if (result.data && onCreated) {
          onCreated(result.data);
        }
        toast.success(t('createSuccess'));
        form.reset();
      }
      router.push(`/${locale}/settings/internet-connections`);
      router.refresh();
    } catch (error) {
      toast.error(t('error'), {
        description: 'An unexpected error occurred'
      });
    }
  }

  return (
    <FormWrapper 
      maxWidth="lg"
      title={initialData ? t('editConnectionType') : t('addNewConnectionType')}
      description={initialData ? t('updateConnectionInfo') : t('createNewConnectionType')}
      icon="🌐"
    >
      <FormSection 
        title={t('connectionDetails')}
        description={t('enterConnectionInfo')}
        icon="📡"
        colorScheme="purple"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('type')} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t('typePlaceholder')} {...field} value={field.value ?? ""} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('speed')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('speedPlaceholder')} {...field} value={field.value ?? ""} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('provider')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('providerPlaceholder')} {...field} value={field.value ?? ""} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('status')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('statusPlaceholder')} {...field} value={field.value ?? ""} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cost')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={t('costPlaceholder')} 
                        {...field} 
                        value={field.value?.toString() ?? ''} 
                        className="bg-white" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full">
              {initialData ? t('saveChanges') : t('create')}
            </Button>
          </form>
        </Form>
      </FormSection>
    </FormWrapper>
  );
}
