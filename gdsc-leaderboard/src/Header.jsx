//Header.jsx
import { Box, Flex, Text, Image, useColorMode, Button, useColorModeValue } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { NavLink } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const borderColor = useColorModeValue('#ff8433', '#ff6600');
  const textColor = useColorModeValue('gray.800', 'white');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  const logoSize = { base: '60px', md: '75px' };
  const logoPadding = { base: '0', md: '0' };

  const logos = [
    { light: "./GDG LOGO BLACK.png", dark: "./GDG LOGO WHITE.png", alt: "GDG Logo" },
    { light: "./rait 1 logo.png", dark: "./rait 1 logo-light.png", alt: "RAIT Logo" },
    { light: "./IIC_LOGO.png", dark: "./IIC_LOGO.png", alt: "IIC Logo" },
  ];

  return (
    <Box
      as="header"
      borderBottom={`3px solid ${borderColor}`}
      py={2}
      position="sticky"
      top={0}
      zIndex="sticky"
      backdropFilter="blur(10px)"
      transition="all 0.3s"
      boxShadow="sm"
    >
      <Flex
        maxW="container.xl"
        mx="auto"
        px={{ base: 4, md: 6 }}
        justifyContent="space-between"
        alignItems="center"
      >
        <Flex alignItems="center" gap={4}>
          {logos.map((logo, index) => (
            <Box key={index} m={{ base: 1, md: 2 }} transition="transform 0.3s">
              <Image
                src={colorMode === 'light' ? logo.light : logo.dark}
                alt={logo.alt}
                maxH={logoSize}
                p={logoPadding}
                _hover={{ transform: 'scale(1.05)' }}
              />
            </Box>
          ))}
        </Flex>

        <Flex alignItems="center">
          <Button
            as={NavLink}
            to="/reveal"
            size="sm"
            variant="ghost"
            leftIcon={<Sparkles size={14} />}
            mr={3}
            _hover={{ bg: hoverBg }}
            color={textColor}
          >
            Reveal
          </Button>
          <Text
            display={{ base: 'none', md: 'block' }}
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight="medium"
            color={textColor}
            mr={4}
          >
            Made by Deeptanshu Lal
          </Text>
          <Button
            onClick={toggleColorMode}
            size="sm"
            variant="ghost"
            aria-label="Toggle color mode"
            _hover={{ bg: hoverBg }}
            border={'1px'}
            >
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;