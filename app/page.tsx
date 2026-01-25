import { Metadata } from 'next'
import HomePage from './home-client'

export const metadata: Metadata = {
  title: 'Home - uHomes Mart',
  description: 'Welcome to uHomes Mart - Your second-hand marketplace',
}

export default function Home() {
  return <HomePage />
}
