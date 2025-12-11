import React from 'react'
import Login from './pages/Login/page.jsx'
import VerifyRoll from './pages/Login/VerifyRoll.jsx';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/layout/navbar.jsx';
import Footer from './components/layout/footer.jsx';
import Home from './pages/Home/page.jsx';
import Contact from './pages/Contact/page.jsx';
import WingPage from './pages/Wing/page.jsx';
import Wings from './pages/Wings/page.jsx';
import AuthState from './context/auth/authState.jsx';
import {toast , Toaster} from 'react-hot-toast';

const App = () => {
  return (
    <>
      <BrowserRouter>
        <AuthState>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16">
              <Toaster/>
              <Routes>
                <Route path='/login' element={<Login />} />
                <Route path='/' element={<Home />} />
                <Route path='/contact-us' element={<Contact />} />
                <Route path='/wing/:wingId' element={<WingPage />} />
                <Route path='/wings' element={<Wings />} />
                <Route path='/login-with-roll' element={<VerifyRoll />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthState>
      </BrowserRouter>
    </>
  )
}

export default App
