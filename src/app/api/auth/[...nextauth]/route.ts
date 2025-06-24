import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb-adapter"
import User from "@/models/User"
import connectDB from "@/lib/mongodb"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password')
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email })

        if (!user) {
          throw new Error('No user found with this email')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; name?: string | null; email?: string | null; image?: string | null }).id = token.id as string
      }
      return session
    }
  },
  // Environment-specific configuration
  ...(process.env.NODE_ENV === 'production' && {
    // Production settings
    useSecureCookies: true,
  }),
  ...(process.env.NODE_ENV && process.env.NODE_ENV.includes('staging') && {
    // Staging settings - similar to production but with staging-specific options
    useSecureCookies: true,
  })
})

export { handler as GET, handler as POST } 