'use client'

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import styles from "./page.module.css";
import db from "../db/db.json";

export default function Home() {
  const { data: session } = useSession()

  console.log(db);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <h1 className="text-4xl font-bold mb-8 text-center">Welcome to WhereTo</h1>
          
          {session ? (
            <div className="space-y-4 text-center">
              <p className="text-lg">Hi, {session.user?.name}!</p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/profile"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => signOut()}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <Link
                href="/auth/signin"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
