'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Shield } from 'lucide-react';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  seller: string;
  verified: boolean;
  condition: string;
}

export function ProductCard({
  id,
  title,
  price,
  image,
  rating,
  reviews,
  seller,
  verified,
  condition,
}: ProductCardProps) {
  return (
    <Link href={`/product/${id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="relative h-40 bg-muted">
            <Image
              src={image || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover rounded-t-lg"
            />
            <Badge className="absolute top-2 right-2" variant="secondary">
              {condition}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-3 p-4">
          <div className="w-full">
            <h3 className="font-semibold text-foreground line-clamp-2">{title}</h3>
            <p className="text-2xl font-bold text-primary mt-2">${price.toFixed(2)}</p>
          </div>

          <div className="w-full flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviews})</span>
            </div>
          </div>

          <div className="w-full flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{seller}</span>
            {verified && <Shield className="h-3 w-3 text-primary" />}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
