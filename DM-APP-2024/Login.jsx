// Login.js

import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from './Firebase/firebase'; // Import the firebase instance

import {handleLogin} from './Firebase/AuthManager.js'


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

 
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Login</h2>
      <form style={{ display: 'flex', flexDirection: 'column', width: '300px', margin: 'auto' }}>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />

        <button type="button" onClick={() => {
          handleLogin(email, password)
        }} style={{ marginTop: '15px' }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
