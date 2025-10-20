"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { ResponsiveImage, ServiceIcon } from "./responsive-image"
import { ArrowRight, Check, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ServiceData {
  id: string
  title: string
  description: string
  longDescription?: string
  icon: string
  features: string[]
  benefits?: string[]
  pricing?: {
    startingPrice?: number
    currency: string
    period?: string
    priceLabel?: string
  }
  ctaText?: string
  ctaLink?: string
  isPopular?: boolean
  isNew?: boolean
}

interface ServiceCardProps {
  service: ServiceData
  variant?: "default" | "compact" | "detailed" | "pricing"
  showCta?: boolean
  onCtaClick?: () => void
  className?: string
}

export function ServiceCard({
  service,
  variant = "default",
  showCta = true,
  onCtaClick,
  className
}: ServiceCardProps) {
  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick()
    } else if (service.ctaLink) {
      window.open(service.ctaLink, '_blank')
    }
  }

  if (variant === "compact") {
    return (
      <Card className={cn(
        "hover:shadow-md transition-all duration-300 group cursor-pointer",
        className
      )} onClick={handleCtaClick}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <ServiceIcon
                src={service.icon}
                alt={service.title}
                className="group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base mb-1 line-clamp-1">
                {service.title}
              </CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {service.description}
              </CardDescription>
              {showCta && (
                <div className="flex items-center text-primary text-sm mt-2 group-hover:translate-x-1 transition-transform">
                  <span>{service.ctaText || "Learn more"}</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "pricing") {
    return (
      <Card className={cn(
        "relative hover:shadow-lg transition-all duration-300",
        service.isPopular && "ring-2 ring-primary scale-105",
        className
      )}>
        {service.isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground px-3 py-1">
              <Star className="h-3 w-3 mr-1" />
              Most Popular
            </Badge>
          </div>
        )}
        
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <ServiceIcon src={service.icon} alt={service.title} />
          </div>
          <CardTitle className="text-xl">{service.title}</CardTitle>
          <CardDescription>{service.description}</CardDescription>
          
          {service.pricing && (
            <div className="mt-4">
              <div className="text-3xl font-bold">
                {service.pricing.startingPrice ? (
                  <>
                    {service.pricing.startingPrice.toLocaleString()} {service.pricing.currency}
                    {service.pricing.period && (
                      <span className="text-base text-muted-foreground">/{service.pricing.period}</span>
                    )}
                  </>
                ) : (
                  service.pricing.priceLabel || "Contact us"
                )}
              </div>
              {service.pricing.startingPrice && (
                <p className="text-sm text-muted-foreground mt-1">Starting from</p>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {service.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          
          {showCta && (
            <Button 
              className="w-full" 
              onClick={handleCtaClick}
              variant={service.isPopular ? "default" : "outline"}
            >
              {service.ctaText || "Get Started"}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (variant === "detailed") {
    return (
      <Card className={cn(
        "hover:shadow-lg transition-all duration-300 group",
        className
      )}>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ServiceIcon
                src={service.icon}
                alt={service.title}
                className="group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{service.title}</CardTitle>
                {service.isNew && (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
                {service.isPopular && (
                  <Badge className="text-xs">Popular</Badge>
                )}
              </div>
              <CardDescription>{service.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {service.longDescription && (
            <p className="text-sm text-muted-foreground">
              {service.longDescription}
            </p>
          )}
          
          <div>
            <h4 className="font-medium mb-2">Key Features:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {service.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          {service.benefits && service.benefits.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Benefits:</h4>
              <div className="space-y-1">
                {service.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {service.pricing && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-lg font-semibold">
                {service.pricing.startingPrice ? (
                  <>
                    Starting from {service.pricing.startingPrice.toLocaleString()} {service.pricing.currency}
                    {service.pricing.period && (
                      <span className="text-sm text-muted-foreground">/{service.pricing.period}</span>
                    )}
                  </>
                ) : (
                  service.pricing.priceLabel || "Contact us for pricing"
                )}
              </div>
            </div>
          )}
          
          {showCta && (
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCtaClick}>
                {service.ctaText || "Learn More"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline">
                Contact Us
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-300 group h-full",
      className
    )}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <ServiceIcon
            src={service.icon}
            alt={service.title}
            className="group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <CardTitle className="text-lg">{service.title}</CardTitle>
          {service.isNew && (
            <Badge variant="secondary" className="text-xs">New</Badge>
          )}
        </div>
        <CardDescription className="line-clamp-3">
          {service.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="space-y-2">
            {service.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
            {service.features.length > 4 && (
              <p className="text-xs text-muted-foreground">
                +{service.features.length - 4} more features
              </p>
            )}
          </div>
        </div>
        
        {service.pricing && (
          <div className="text-center py-2">
            <div className="font-semibold">
              {service.pricing.startingPrice ? (
                <>
                  From {service.pricing.startingPrice.toLocaleString()} {service.pricing.currency}
                  {service.pricing.period && (
                    <span className="text-sm text-muted-foreground">/{service.pricing.period}</span>
                  )}
                </>
              ) : (
                service.pricing.priceLabel || "Contact us"
              )}
            </div>
          </div>
        )}
        
        {showCta && (
          <Button className="w-full" onClick={handleCtaClick}>
            {service.ctaText || "Learn More"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Service grid component for displaying multiple services
export function ServiceGrid({ 
  services, 
  variant = "default",
  className 
}: { 
  services: ServiceData[]
  variant?: "default" | "compact" | "detailed" | "pricing"
  className?: string 
}) {
  const gridClasses = {
    default: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    compact: "grid-cols-1 md:grid-cols-2",
    detailed: "grid-cols-1 lg:grid-cols-2",
    pricing: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  }

  return (
    <div className={cn(
      "grid gap-6",
      gridClasses[variant],
      className
    )}>
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          variant={variant}
        />
      ))}
    </div>
  )
}