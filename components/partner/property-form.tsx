"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Upload, MapPin, DollarSign, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PhotoUpload } from "@/components/lofts/photo-upload";
import type { Loft, LoftStatus } from "@/lib/types";

const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  address: z.string().min(1, "Address is required"),
  description: z.string().optional(),
  price_per_night: z.number().min(0, "Price must be positive").optional(),
  price_per_month: z.number().min(0, "Price must be positive").optional(),
  status: z.enum(["available", "occupied", "maintenance"]),
  amenities: z.array(z.string()).optional(),
  max_guests: z.number().min(1, "Must accommodate at least 1 guest").optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  area_sqm: z.number().min(0).optional(),
  is_published: z.boolean().default(false),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  property?: Loft | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

const COMMON_AMENITIES = [
  'wifi',
  'kitchen',
  'parking',
  'air_conditioning',
  'heating',
  'washing_machine',
  'tv',
  'balcony',
  'pool',
  'gym',
  'elevator',
  'pet_friendly',
];

export function PropertyForm({ property, mode, onSuccess, onCancel }: PropertyFormProps) {
  const t = useTranslations("partner");
  const [loading, setLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: property?.name || "",
      address: property?.address || "",
      description: property?.description || "",
      price_per_night: property?.price_per_night || undefined,
      price_per_month: property?.price_per_month || undefined,
      status: property?.status || "available",
      is_published: false,
      max_guests: 2,
      bedrooms: 1,
      bathrooms: 1,
      area_sqm: undefined,
    },
  });

  useEffect(() => {
    if (property && mode === 'edit') {
      form.reset({
        name: property.name,
        address: property.address,
        description: property.description || "",
        price_per_night: property.price_per_night || undefined,
        price_per_month: property.price_per_month || undefined,
        status: property.status,
        is_published: false, // Will be set from API
      });
    }
  }, [property, mode, form]);

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        amenities: selectedAmenities,
      };

      const url = mode === 'create' 
        ? '/api/partner/properties'
        : `/api/partner/properties/${property?.id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save property');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : t('properties.saveError') || 'Error saving property'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {mode === 'create' 
              ? t('properties.addProperty') || 'Add New Property'
              : t('properties.editProperty') || 'Edit Property'
            }
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {t('properties.tabs.basic') || 'Basic Info'}
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('properties.tabs.details') || 'Details'}
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('properties.tabs.pricing') || 'Pricing'}
                </TabsTrigger>
                <TabsTrigger value="photos" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {t('properties.tabs.photos') || 'Photos'}
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {t('properties.basicInfo') || 'Basic Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('properties.name') || 'Property Name'}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('properties.namePlaceholder') || 'Enter property name'}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('properties.address') || 'Address'}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('properties.addressPlaceholder') || 'Enter full address'}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('properties.description') || 'Description'}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('properties.descriptionPlaceholder') || 'Describe your property...'}
                              rows={4}
                              {...field} 
                            />
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
                          <FormLabel>{t('properties.status.label') || 'Status'}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('properties.status.placeholder') || 'Select status'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="available">
                                {t('properties.status.available') || 'Available'}
                              </SelectItem>
                              <SelectItem value="occupied">
                                {t('properties.status.occupied') || 'Occupied'}
                              </SelectItem>
                              <SelectItem value="maintenance">
                                {t('properties.status.maintenance') || 'Maintenance'}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('properties.propertyDetails') || 'Property Details'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="max_guests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('properties.maxGuests') || 'Max Guests'}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('properties.bedrooms') || 'Bedrooms'}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('properties.bathrooms') || 'Bathrooms'}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="area_sqm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('properties.area') || 'Area (m²)'}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Amenities */}
                    <div>
                      <FormLabel className="text-base font-medium">
                        {t('properties.amenities') || 'Amenities'}
                      </FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {COMMON_AMENITIES.map((amenity) => (
                          <div
                            key={amenity}
                            className={`
                              flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors
                              ${selectedAmenities.includes(amenity)
                                ? 'bg-primary/10 border-primary'
                                : 'bg-background border-border hover:bg-muted'
                              }
                            `}
                            onClick={() => toggleAmenity(amenity)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedAmenities.includes(amenity)}
                              onChange={() => toggleAmenity(amenity)}
                              className="rounded"
                            />
                            <span className="text-sm">
                              {t(`properties.amenities.${amenity}`) || amenity.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {t('properties.pricing') || 'Pricing'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price_per_night"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('properties.pricePerNight') || 'Price per Night ($)'}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price_per_month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('properties.pricePerMonth') || 'Price per Month ($)'}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="is_published"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('properties.publishProperty') || 'Publish Property'}
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              {t('properties.publishDescription') || 'Make this property visible to clients'}
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      {t('properties.photos') || 'Property Photos'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {property?.id ? (
                      <PhotoUpload
                        loftId={property.id}
                        maxPhotos={10}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t('properties.saveFirstToUpload') || 'Save the property first to upload photos'}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    {mode === 'create' 
                      ? t('properties.createProperty') || 'Create Property'
                      : t('properties.updateProperty') || 'Update Property'
                    }
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}