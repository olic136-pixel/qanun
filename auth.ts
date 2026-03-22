import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

declare module 'next-auth' {
  interface User {
    accessToken?: string
    role?: string
    jurisdictions?: string[]
    onboardingComplete?: boolean
  }

  interface Session {
    user: User & {
      accessToken?: string
      role?: string
      jurisdictions?: string[]
      onboardingComplete?: boolean
    }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string
    role?: string
    jurisdictions?: string[]
    onboardingComplete?: boolean
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          )

          if (!res.ok) return null

          const data = await res.json()
          const user = data.user ?? data

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            jurisdictions: user.jurisdictions,
            onboardingComplete: user.onboarding_complete,
            accessToken: data.access_token,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 28800, // 8 hours
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.role = user.role
        token.jurisdictions = user.jurisdictions
        token.onboardingComplete = user.onboardingComplete
      }
      return token
    },
    async session({ session, token }) {
      session.user.accessToken = token.accessToken
      session.user.role = token.role
      session.user.jurisdictions = token.jurisdictions
      session.user.onboardingComplete = token.onboardingComplete
      return session
    },
  },
})
