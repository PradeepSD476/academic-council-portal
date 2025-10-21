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
        <Navbar />
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/' element={<Home />} />
          <Route path='/contact-us' element={<Contact />} />
          <Route path='/wing/:wingId' element={<WingPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  )
}

export default App
