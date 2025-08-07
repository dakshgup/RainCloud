'use client'

import { useState, useEffect } from 'react'
import { fetchUserData, UserData } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UserDataFetcher() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetchUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const userData = await fetchUserData()
      setUsers(userData)
      console.log('User data displayed in component:', userData)
    } catch (err) {
      setError('Failed to fetch user data')
      console.error('Component error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleFetchUsers()
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>User Data Fetching System</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={handleFetchUsers} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Fetching Users...' : 'Fetch User Data'}
          </Button>
          
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-semibold">Fetched Users ({users.length}):</h3>
            {users.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No users found. Check console for detailed logs.
              </p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="p-3 border rounded-lg">
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    {user.name && <p><strong>Name:</strong> {user.name}</p>}
                    <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}