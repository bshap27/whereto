/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { useRequireAuthRedirect } from './useRequireAuthRedirect'
import * as nextAuthReact from 'next-auth/react'
import * as nextNavigation from 'next/navigation'

jest.mock('next-auth/react')
jest.mock('next/navigation')

describe('useRequireAuthRedirect', () => {
  let pushMock: jest.Mock

  beforeEach(() => {
    pushMock = jest.fn()
    ;(nextNavigation.useRouter as jest.Mock).mockReturnValue({ push: pushMock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('redirects to /auth/signin when status is unauthenticated', () => {
    ;(nextAuthReact.useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
    renderHook(() => useRequireAuthRedirect())
    expect(pushMock).toHaveBeenCalledWith('/auth/signin')
  })

  it('does not redirect when status is authenticated', () => {
    ;(nextAuthReact.useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
    renderHook(() => useRequireAuthRedirect())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('does not redirect when status is loading', () => {
    ;(nextAuthReact.useSession as jest.Mock).mockReturnValue({ status: 'loading' })
    renderHook(() => useRequireAuthRedirect())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('redirects to a custom path if provided', () => {
    ;(nextAuthReact.useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
    renderHook(() => useRequireAuthRedirect('/custom-login'))
    expect(pushMock).toHaveBeenCalledWith('/custom-login')
  })
}) 