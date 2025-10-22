import React from 'react'
import Login from './pages/Login/page.jsx'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/layout/navbar.jsx';
import Footer from './components/layout/footer.jsx';
import Home from './pages/Home/page.jsx';
import Contact from './pages/Contact/page.jsx';
import WingPage from './pages/Wing/page.jsx';

const App = () => {
  return (
    <>
      <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16">
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/' element={<Home />} />
          <Route path='/contact-us' element={<Contact />} />
          <Route path='/wing/:wingId' element={<WingPage />} />
        </Routes>
        </main>
        <Footer />
        </div>
      </BrowserRouter>
    </>
  )
}

export default App
