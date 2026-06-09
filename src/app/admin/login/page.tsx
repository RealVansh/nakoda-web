'use client'

import { useState } from 'react'
import { login } from '@/actions/auth.actions'
import { Loader2 } from 'lucide-react'

export default function AdminLogin() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const result = await login({ email, password })

    if (result && !result.success) {
      if (result.error) {
        setError(result.error)
      } else if (result.errors) {
        setError('Invalid email or password format.')
      }
      setIsPending(false)
    }
    // On success, the server action handles the redirect
  }

  return (
    <div className="theme-admin min-h-screen bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Nakoda Admin
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sign in to manage your jewellery catalogue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-background py-8 px-4 shadow-sm border border-border sm:rounded-lg sm:px-10">
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md" role="alert">
                {error}
              </div>
            )}
            
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
