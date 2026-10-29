import { useState, useContext } from 'react'
import menuIcon from '../../Assets/Images/icon-menu.svg'
import closeIcon from '../../Assets/Images/icon-close.svg'
import './header.scss'
import { Link, useNavigate } from 'react-router-dom'
import UserContext from '../../Context/userContext'

function Header () {
  const [toggle, setToggle] = useState(false) 
  const { logout, user } = useContext(UserContext)

  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <div id='navcard' className={toggle ? 'show' : ''}>
        <img id='close' src={closeIcon} onClick={() => setToggle(false)}></img>
        <ul>
          <a href='#about' onClick={() => setToggle(false)}>About</a>
          <li>
            <a href='#contact'>Contact Us</a>
          </li>
          {user ? (
             <>
                <Link to='dashboard'>Dashboard</Link>
              <button className='btn btn-danger' onClick={handleLogout}>Logout</button>
             </>
            ) : (
              <>
                <Link to={'/register'}>Register</Link>
                <Link to={'/login'}>Login</Link>
              </>
            )}
        </ul>
      </div>

      <header className='header_home'>
        <Link id='logo' to='/'>
          🌙 Luna HRM
        </Link>

        <nav id='navbar'>
          <ul>
            <li>
              <a href='#about'>About</a>
            </li>
            <li>
              <a href='#contact'>Contact us</a>
            </li>
            {user ? (
             <>
                <Link to='dashboard'>Dashboard</Link>
              <button className='btn btn-danger' onClick={handleLogout}>Logout</button>
             </>
            ) : (
              <>
                <Link to={'/register'}>Register</Link>
                <Link to={'/login'}>Login</Link>
              </>
            )}
          </ul>
        </nav>
        <img
          src={menuIcon}
          onClick={() => setToggle(true)}
          id='menuBar'
          alt=''
        />
      </header>
    </>
  )
}

export default Header
