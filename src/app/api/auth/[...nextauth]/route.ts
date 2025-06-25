import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb-adapter"
import User from "@/models/User"
import connectDB from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { USER_ERRORS, AUTH_ERRORS } from "@/constants/errors"

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
          throw new Error(USER_ERRORS.EMAIL_AND_PASSWORD_REQUIRED)
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email })

        if (!user) {
          throw new Error(AUTH_ERRORS.USER_NOT_FOUND)
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error(AUTH_ERRORS.INVALID_PASSWORD)
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
  // Production settings
  ...(['production', 'staging'].includes(process.env.NODE_ENV) && {
    useSecureCookies: true,
    cookies: {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true,
        },
      },
    },
  }),
})

export { handler as GET, handler as POST } 