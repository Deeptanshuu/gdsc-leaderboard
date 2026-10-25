import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, ColorModeScript  } from '@chakra-ui/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import LeaderBoard from './LeaderBoard.jsx'
import Reveal from './pages/Reveal.jsx'
import Shell from './components/Shell.jsx'
import LeaderboardProvider from './context/LeaderboardProvider.jsx'
import './index.css'
import Theme from './Theme.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={Theme}>
      <ColorModeScript initialColorMode={Theme.config.initialColorMode} />
      <LeaderboardProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<App />} />
              <Route path="/lb" element={<LeaderBoard />} />
              <Route path="/reveal" element={<Reveal />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LeaderboardProvider>
    </ChakraProvider>
  </StrictMode>,
)
