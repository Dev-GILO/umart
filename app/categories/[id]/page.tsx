import CategoriesBrowseClient from './client'

export const metadata = {
  title: 'Browse Category - Umart',
  description: 'Browse products in category',
}

export default async function CategoryBrowsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CategoriesBrowseClient categoryId={id} />
}