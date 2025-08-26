import { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = async (e:any) => {
    e.preventDefault();
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    location.href='/';
  };
  return (
    <form onSubmit={submit} style={{maxWidth:360,margin:'64px auto',display:'grid',gap:8}}>
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit">Sign in</button>
    </form>
  );
}
