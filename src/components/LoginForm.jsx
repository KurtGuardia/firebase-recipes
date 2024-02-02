import React, { useState } from 'react'
import FirebaseAuthService from '../FirebaseAuthService'

const LoginForm = ({ existingUser }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      await FirebaseAuthService.registerUser(
        username,
        password,
      )
    } catch (error) {
      alert(error.message)
    }
  }

  function handleLogout() {
    FirebaseAuthService.logoutUser()
  }

  async function handleSendResetPasswordEmail(){
    if(!username){
        alert("Missing username bro")
        return
    }

    try {
        await FirebaseAuthService.sendPasswordResetEmail(username);
        alert("sent the password reset email")
    } catch (error) {
        alert(error.message)
    }
  }

  return (
    <div className='login-form-container'>
      {existingUser ? (
        <div className='row'>
          <h3>Welcome, {existingUser.email}</h3>
          <button
            className='primary-button'
            type='button'
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className='login-form'
        >
          <label className='input-label login-label'>
            Username (email)
            <input
              type='email'
              className='input-text'
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className='input-label login-label'>
            Password:
            <input
              type='password'
              className='input-text'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <div className="button-box">
            <button className="primary-button">Submit</button>
            <button className="primary-button" onClick={handleSendResetPasswordEmail}>Reset Password</button>
            </div>
        </form>
      )}
    </div>
  )
}

export default LoginForm
