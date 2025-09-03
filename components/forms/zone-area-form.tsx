"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { FormWrapper, FormSection } from "@/components/ui/form-wrapper"
import { createZoneArea, updateZoneArea, ZoneArea } from "@/app/actions/zone-areas" // Import updateZoneArea and ZoneArea
import { useRouter } from "next/navigation"

import { useEffect } from "react";

interface ZoneAreaFormProps {
  zoneArea?: ZoneArea; // Optional zoneArea prop for editing
  onSuccess?: () => void; // Callback for success
  onCancel?: () => void; // Callback for cancel
}

export function ZoneAreaForm({ zoneArea, onSuccess, onCancel }: ZoneAreaFormProps) {
  const router = useRouter();
  const t = useTranslations("common");
  
  const FormSchema = z.object({
    name: z.string().min(2, {
      message: t('zoneAreas.nameRequired'),
    }),
  });
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: zoneArea?.name || "", // Pre-fill if editing
    },
  });

  // Reset form when zoneArea prop changes (for editing)
  useEffect(() => {
    form.reset({ name: zoneArea?.name || "" });
  }, [zoneArea, form]);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const formData = new FormData();
    formData.append("name", data.name);

    let result;
    if (zoneArea) {
      // Update existing zone area
      result = await updateZoneArea(zoneArea.id, formData);
    } else {
      // Create new zone area
      result = await createZoneArea(formData);
    }

    if (result?.error) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('common.success'),
        description: zoneArea ? t('zoneAreas.updateSuccess') : t('zoneAreas.createSuccess'),
      });
      form.reset();
      if (onSuccess) {
        onSuccess();
      } else {
        // router.refresh(); // Revalidate the page to show new/updated zone area
      }
    }
  }

  return (
    <FormWrapper 
      maxWidth="md"
      title={zoneArea ? t('zoneAreas.editZoneArea') : t('zoneAreas.addNewZoneArea')}
      description={zoneArea ? t('zoneAreas.updateZoneAreaInfo') : t('zoneAreas.createNewZoneArea')}
      icon="🗺️"
    >
      <FormSection 
        title={t('zoneAreas.zoneDetails')}
        description={t('zoneAreas.enterZoneInfo')}
        icon="📍"
        colorScheme="green"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('zoneAreas.zoneAreaName')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('zoneAreas.namePlaceholder')} {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {zoneArea ? t('zoneAreas.updateZoneArea') : t('zoneAreas.createZoneArea')}
            </Button>
          </form>
        </Form>
      </FormSection>
    </FormWrapper>
  )
}
