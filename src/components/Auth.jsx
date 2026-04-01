import { useState } from 'react'
import { supabase, USER_IDS, getUserColors, getPartnerColors } from '../lib/supabase'

const Auth = ({ onAuthComplete }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showIdentitySelect, setShowIdentitySelect] = useState(false)
  const [selectedIdentity, setSelectedIdentity] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error
        // Check if user is actually signed in (email confirmation may be required)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('check your email to confirm your account, then sign in')
          return
        }
        setShowIdentitySelect(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        setShowIdentitySelect(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleIdentitySelect = (identity) => {
    setSelectedIdentity(identity)
    // Save identity to localStorage so it persists across refreshes
    localStorage.setItem('userIdentity', identity)
    onAuthComplete(identity)
  }

  if (showIdentitySelect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            who u po?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            pili haha
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => handleIdentitySelect(USER_IDS.BIG_C)}
              className="w-full p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  C
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">big C</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{USER_IDS.BIG_C}</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleIdentitySelect(USER_IDS.SMOL_R)}
              className="w-full p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  R
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">smol R</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{USER_IDS.SMOL_R}</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          CnR
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
          our mini home :3
        </p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="sana@gabos.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="nyahaha"
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'wait lang pooo...' : isSignUp ? 'sign up' : 'sign in'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm"
          >
            {isSignUp 
              ? 'igwa na account? sign in' 
              : "dai pa account? sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth
