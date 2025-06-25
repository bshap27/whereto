/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import SignIn from './page'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  getSession: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('SignIn Page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>)
  })

  describe('Initial render and session check', () => {
    it('renders signin form with all elements', () => {
      mockGetSession.mockResolvedValue(null)

      render(<SignIn />)

      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
      expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
      expect(screen.getByText('Sign up')).toBeInTheDocument()
    })

    it('redirects to profile if user is already signed in', async () => {
      mockGetSession.mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: '2024-01-01',
      } as Awaited<ReturnType<typeof getSession>>)

      render(<SignIn />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile')
      })
    })

    it('does not redirect if user is not signed in', async () => {
      mockGetSession.mockResolvedValue(null)

      render(<SignIn />)

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('Form interactions', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(null)
    })

    it('updates email input value', () => {
      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('updates password input value', () => {
      render(<SignIn />)

      const passwordInput = screen.getByLabelText('Password')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      expect(passwordInput).toHaveValue('password123')
    })

    it('shows loading state when form is submitted', async () => {
      mockSignIn.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
      })
    })
  })

  describe('Form submission', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(null)
    })

    it('calls signIn with correct credentials', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null } as Awaited<ReturnType<typeof signIn>>)

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        })
      })
    })

    it('redirects to profile on successful signin', async () => {
      mockSignIn.mockResolvedValue({ ok: true, error: null } as Awaited<ReturnType<typeof signIn>>)

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile')
      })
    })

    it('displays error message when signin fails', async () => {
      mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials' } as Awaited<ReturnType<typeof signIn>>)

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('displays generic error message when signin throws exception', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'))

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      })
    })

    it('clears previous error message on new submission', async () => {
      mockSignIn
        .mockResolvedValueOnce({ ok: false, error: 'First error' } as Awaited<ReturnType<typeof signIn>>)
        .mockResolvedValueOnce({ ok: false, error: 'Second error' } as Awaited<ReturnType<typeof signIn>>)

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      // First submission
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument()
      })

      // Second submission
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Second error')).toBeInTheDocument()
        expect(screen.queryByText('First error')).not.toBeInTheDocument()
      })
    })

    it('resets loading state after signin attempt', async () => {
      mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials' } as Awaited<ReturnType<typeof signIn>>)

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled()
      })
    })
  })

  describe('Navigation links', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(null)
    })

    it('has correct link to forgot password page', () => {
      render(<SignIn />)

      const forgotPasswordLink = screen.getByText('Forgot your password?')
      expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password')
    })

    it('has correct link to register page', () => {
      render(<SignIn />)

      const registerLink = screen.getByText('Sign up')
      expect(registerLink).toHaveAttribute('href', '/auth/register')
    })
  })

  describe('Form validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(null)
    })

    it('requires email and password fields', () => {
      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
    })

    it('has correct input types', () => {
      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('has correct autocomplete attributes', () => {
      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
    })
  })

  describe('Error message styling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(null)
    })

    it('displays error message in red container', async () => {
      mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials' } as Awaited<ReturnType<typeof signIn>>)

      render(<SignIn />)

      const emailInput = screen.getByLabelText('Email address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        const errorText = screen.getByText('Invalid credentials')
        const errorContainer = errorText.parentElement
        expect(errorContainer).toHaveClass('rounded-md', 'bg-red-50', 'p-4')
      })
    })
  })
}) 