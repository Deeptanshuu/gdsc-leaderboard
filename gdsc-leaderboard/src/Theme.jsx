import { extendTheme } from '@chakra-ui/react'

// Dark by default: the shader backdrop is built for night. Light mode is still one click away.
const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const Theme = extendTheme({ 
  config,
  styles: {
    global: (props) => ({
      // Matches the shader's base colour so there is no flash before WebGL starts.
      body: {
        bg: props.colorMode === 'light' ? '#fff6ee' : '#07020f',
      },
    }),
  },
})

export default Theme
