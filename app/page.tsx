import { Metadata } from 'next'
import HomePage from './home-client'

export const metadata: Metadata = {
  title: 'Home - U Mart',
  description: 'Welcome to U Mart - Your favourite marketplace',
}

export default function Home() {
  return <HomePage />
}
