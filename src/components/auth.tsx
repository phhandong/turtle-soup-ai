import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ImageUp,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  UserRound,
} from 'lucide-react'
import {
  ApiError,
  loginUser,
  registerUser,
  updateProfile,
  type AuthUser,
} from '../services/authClient'

export function AuthGate({
  defaultMode,
  error,
  onAuthenticated,
  onBackHome,
}: {
  defaultMode: 'login' | 'register'
  error: string
  onAuthenticated: (user: AuthUser) => Promise<void>
  onBackHome: () => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState(error)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFormError(error)
  }, [error])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    try {
      const user =
        mode === 'register'
          ? await registerUser({ username, email, password })
          : await loginUser({ identity, password })
      await onAuthenticated(user)
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : '请求失败，请稍后再试。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    setMode(nextMode)
    setPassword('')
    setFormError('')
  }

  return (
    <main className="app-shell auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">Turtle Soup</p>
        <h1>登录后开始推理。</h1>
        <p>
          题库可以自由浏览；进入一题后，追问、提示和揭晓会保存到你的账号里。
        </p>
      </section>

      <section className="auth-panel" aria-label="用户登录注册">
        <button className="auth-back-button" type="button" onClick={onBackHome}>
          <ArrowLeft size={17} />
          返回题库
        </button>
        <div className="auth-tabs" role="tablist">
          <button
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            type="button"
            onClick={() => switchMode('login')}
          >
            <LogIn size={17} />
            登录
          </button>
          <button
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            type="button"
            onClick={() => switchMode('register')}
          >
            <UserRound size={17} />
            注册
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <>
              <label>
                <span>用户名</span>
                <div className="auth-field">
                  <UserRound size={18} />
                  <input
                    autoComplete="username"
                    maxLength={24}
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
              </label>
              <label>
                <span>邮箱</span>
                <div className="auth-field">
                  <Mail size={18} />
                  <input
                    autoComplete="email"
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>
            </>
          ) : (
            <label>
              <span>用户名或邮箱</span>
              <div className="auth-field">
                <UserRound size={18} />
                <input
                  autoComplete="username"
                  required
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                />
              </div>
            </label>
          )}

          <label>
            <span>密码</span>
            <div className="auth-field">
              <LockKeyhole size={18} />
              <input
                autoComplete={
                  mode === 'register' ? 'new-password' : 'current-password'
                }
                minLength={8}
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          {formError ? <p className="error-text">{formError}</p> : null}

          <button className="auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <RefreshCw className="spin" size={18} />
            ) : mode === 'register' ? (
              <UserRound size={18} />
            ) : (
              <LogIn size={18} />
            )}
            {mode === 'register' ? '创建账号' : '登录'}
          </button>
          <button
            className="auth-switch-link"
            type="button"
            onClick={() =>
              switchMode(mode === 'register' ? 'login' : 'register')
            }
          >
            {mode === 'register' ? '已有账号？去登录' : '还没有账号？去注册'}
          </button>
        </form>
      </section>
    </main>
  )
}


export function AuthEntryButton({
  onOpenAuth,
}: {
  onOpenAuth: (mode: 'login' | 'register') => void
}) {
  return (
    <button
      aria-label="登录或注册"
      className="auth-entry-button"
      type="button"
      onClick={() => onOpenAuth('login')}
    >
      <UserRound size={18} />
      登录/注册
    </button>
  )
}

export function AccountMenu({
  user,
  onLogout,
}: {
  user: AuthUser
  onLogout: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="打开个人菜单"
        className="avatar-button"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <UserAvatar user={user} />
      </button>
      {isOpen ? (
        <div className="account-menu-panel" role="menu">
          <p className="account-menu-title">个人详情</p>
          <strong>{user.username}</strong>
          <span>{user.email}</span>
          <a href="#/profile" role="menuitem">
            <UserRound size={16} />
            编辑资料
          </a>
          <button type="button" role="menuitem" onClick={onLogout}>
            <LogOut size={16} />
            退出账号
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function ProfilePage({
  user,
  onBackHome,
  onUserChange,
}: {
  user: AuthUser
  onBackHome: () => void
  onUserChange: (user: AuthUser) => void
}) {
  const [username, setUsername] = useState(user.username)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUser = { ...user, username, avatarUrl }

  async function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setError('')
    setNotice('')
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setError('头像仅支持 PNG、JPG、WebP 或 GIF。')
      return
    }

    if (file.size > 256 * 1024) {
      setError('头像文件需小于 256 KB。')
      return
    }

    const dataUrl = await readFileAsDataUrl(file)
    setAvatarUrl(dataUrl)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const updatedUser = await updateProfile({
        username,
        avatarUrl,
      })
      onUserChange(updatedUser)
      setNotice('资料已保存。')
    } catch (error) {
      setError(
        error instanceof ApiError ? error.message : '保存失败，请稍后再试。',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="app-shell profile-shell">
      <nav className="story-nav" aria-label="页面导航">
        <button
          aria-label="返回首页"
          className="nav-round-button"
          title="返回首页"
          type="button"
          onClick={onBackHome}
        >
          <ArrowLeft size={19} />
        </button>
      </nav>

      <section className="profile-panel">
        <div className="profile-heading">
          <div>
            <p className="eyebrow">Profile</p>
            <h1>个人资料</h1>
          </div>
          <UserAvatar className="profile-avatar" user={previewUser} />
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            <span>用户名</span>
            <input
              maxLength={24}
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label>
            <span>邮箱</span>
            <input readOnly value={user.email} />
          </label>

          <div className="profile-upload-row">
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="visually-hidden"
              ref={fileInputRef}
              type="file"
              onChange={handleAvatarChange}
            />
            <button
              className="secondary-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp size={18} />
              上传头像
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {notice ? <p className="success-text">{notice}</p> : null}

          <button className="auth-submit" disabled={isSaving} type="submit">
            {isSaving ? (
              <RefreshCw className="spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            保存资料
          </button>
        </form>
      </section>
    </main>
  )
}

function UserAvatar({
  className = '',
  user,
}: {
  className?: string
  user: Pick<AuthUser, 'avatarKey' | 'avatarUrl' | 'username'>
}) {
  if (user.avatarUrl) {
    return (
      <span className={`avatar-image ${className}`.trim()} aria-hidden="true">
        <img alt="" src={user.avatarUrl} />
      </span>
    )
  }

  const avatarClassName = `avatar-mark ${getAvatarClassName(user.avatarKey)} ${className}`
  return (
    <span className={avatarClassName.trim()} aria-hidden="true">
      <span />
    </span>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getAvatarClassName(avatarKey: string | undefined) {
  const value =
    avatarKey && /^[a-z]+-[0-5]$/.test(avatarKey) ? avatarKey : 'moss-0'
  return `avatar-${value}`
}
