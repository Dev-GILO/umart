export interface Product {
  id: string;
  title: string;
  price: number;
  categoryId: string;
  images?: string[];
  description?: string;
}

export function getRelatedProducts(
  products: Product[],
  currentProduct: Product,
  limit = 4
): Product[] {
  return products
    .filter(
      product =>
        product.id !== currentProduct.id &&
        product.categoryId === currentProduct.categoryId
    )
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

export function getSimilarProductsByTitle(
  products: Product[],
  currentProduct: Product,
  limit = 4
): Product[] {
  const keywords = currentProduct.title.toLowerCase().split(' ');

  return products
    .filter(product => {
      if (product.id === currentProduct.id) return false;
      const productKeywords = product.title.toLowerCase().split(' ');
      return keywords.some(keyword =>
        productKeywords.some(pk => pk.includes(keyword) || keyword.includes(pk))
      );
    })
    .slice(0, limit);
}
