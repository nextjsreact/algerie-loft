"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { ResponsiveImage, PropertyImage } from "./responsive-image"
import { Modal, ContactModal, ImageModal } from "./modal"
import { MapPin, Bed, Bath, Square, Eye, Heart, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

interface PropertyData {
  id: string
  title: string
  description: string
  location: {
    address: string
    city: string
    coordinates?: [number, number]
  }
  images: string[]
  features: {
    bedrooms?: number
    bathrooms?: number
    area?: number
    type: string
  }
  amenities: string[]
  price?: {
    amount: number
    currency: string
    period?: string
  }
  status: "available" | "rented" | "sold" | "maintenance"
  isHighlighted?: boolean
}

interface PropertyCardProps {
  property: PropertyData
  variant?: "grid" | "list" | "featured"
  showContactButton?: boolean
  onImageClick?: (imageIndex: number) => void
  onContactClick?: () => void
  className?: string
}

export function PropertyCard({
  property,
  variant = "grid",
  showContactButton = true,
  onImageClick,
  onContactClick,
  className
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index)
    if (onImageClick) {
      onImageClick(index)
    } else {
      setShowImageModal(true)
    }
  }

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick()
    } else {
      setShowContactModal(true)
    }
  }

  const statusColors = {
    available: "bg-green-100 text-green-800",
    rented: "bg-blue-100 text-blue-800", 
    sold: "bg-gray-100 text-gray-800",
    maintenance: "bg-yellow-100 text-yellow-800"
  }

  if (variant === "list") {
    return (
      <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow", className)}>
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-1/3">
            <PropertyImage
              src={property.images[0]}
              alt={property.title}
              className="h-48 md:h-full cursor-pointer"
              onClick={() => handleImageClick(0)}
            />
            {property.images.length > 1 && (
              <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                +{property.images.length - 1}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
            </Button>
          </div>
          
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <CardTitle className="text-xl mb-1">{property.title}</CardTitle>
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.location.address}, {property.location.city}
                </div>
              </div>
              <Badge className={statusColors[property.status]}>
                {property.status}
              </Badge>
            </div>
            
            <CardDescription className="mb-4 line-clamp-2">
              {property.description}
            </CardDescription>
            
            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
              {property.features.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  {property.features.bedrooms}
                </div>
              )}
              {property.features.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  {property.features.bathrooms}
                </div>
              )}
              {property.features.area && (
                <div className="flex items-center gap-1">
                  <Square className="h-4 w-4" />
                  {property.features.area}m²
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {property.amenities.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {property.amenities.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{property.amenities.length - 3} more
                </Badge>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              {property.price && (
                <div className="text-lg font-semibold">
                  {property.price.amount.toLocaleString()} {property.price.currency}
                  {property.price.period && (
                    <span className="text-sm text-muted-foreground">/{property.price.period}</span>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                {showContactButton && (
                  <Button size="sm" onClick={handleContactClick}>
                    <Phone className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          src={property.images[currentImageIndex]}
          alt={`${property.title} - Image ${currentImageIndex + 1}`}
          title={property.title}
        />
        
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          propertyTitle={property.title}
        />
      </Card>
    )
  }

  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-lg transition-all duration-300 group",
      property.isHighlighted && "ring-2 ring-primary",
      variant === "featured" && "md:col-span-2",
      className
    )}>
      <div className="relative">
        <PropertyImage
          src={property.images[0]}
          alt={property.title}
          className={cn(
            "cursor-pointer group-hover:scale-105 transition-transform duration-300",
            variant === "featured" ? "h-64" : "h-48"
          )}
          onClick={() => handleImageClick(0)}
        />
        
        {property.images.length > 1 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {property.images.slice(0, 4).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full cursor-pointer transition-colors",
                  index === currentImageIndex ? "bg-white" : "bg-white/50"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  handleImageClick(index)
                }}
              />
            ))}
            {property.images.length > 4 && (
              <Badge className="bg-black/70 text-white text-xs">
                +{property.images.length - 4}
              </Badge>
            )}
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            setIsFavorite(!isFavorite)
          }}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
        </Button>
        
        <Badge className={cn("absolute top-2 left-2", statusColors[property.status])}>
          {property.status}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
          {property.price && (
            <div className="text-right">
              <div className="font-semibold">
                {property.price.amount.toLocaleString()} {property.price.currency}
              </div>
              {property.price.period && (
                <div className="text-xs text-muted-foreground">/{property.price.period}</div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center text-muted-foreground text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{property.location.address}, {property.location.city}</span>
        </div>
        
        <CardDescription className="mb-3 line-clamp-2">
          {property.description}
        </CardDescription>
        
        <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
          {property.features.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {property.features.bedrooms}
            </div>
          )}
          {property.features.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.features.bathrooms}
            </div>
          )}
          {property.features.area && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              {property.features.area}m²
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {property.amenities.slice(0, 2).map((amenity) => (
            <Badge key={amenity} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {property.amenities.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{property.amenities.length - 2}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {showContactButton && (
            <Button size="sm" className="flex-1" onClick={handleContactClick}>
              <Phone className="h-4 w-4 mr-1" />
              Contact
            </Button>
          )}
        </div>
      </CardContent>
      
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        src={property.images[currentImageIndex]}
        alt={`${property.title} - Image ${currentImageIndex + 1}`}
        title={property.title}
      />
      
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        propertyTitle={property.title}
      />
    </Card>
  )
}

// Property grid component for displaying multiple properties
export function PropertyGrid({ 
  properties, 
  variant = "grid",
  className 
}: { 
  properties: PropertyData[]
  variant?: "grid" | "list"
  className?: string 
}) {
  if (variant === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            variant="list"
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
      className
    )}>
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          variant={property.isHighlighted ? "featured" : "grid"}
        />
      ))}
    </div>
  )
}