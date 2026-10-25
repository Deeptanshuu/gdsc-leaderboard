//Header.jsx
import { useEffect, useState } from 'react';
import { Box, Flex, Text, Image, useColorMode, IconButton, Button, Kbd, useColorModeValue, Tooltip } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutList, Search, Sparkles, Trophy, Zap } from 'lucide-react';
import Ticker from './components/Ticker';
import { hyperMode, paletteOpen, useToggle } from './lib/vibes';
import { ORANGE } from './lib/brand';

const logos = [
  { light: "/GDG LOGO BLACK.png", dark: "/GDG LOGO WHITE.png", alt: "GDG Logo" },
  { light: "/rait 1 logo.png", dark: "/rait 1 logo-light.png", alt: "RAIT Logo" },
  // IIC has no light variant, so dark mode renders it as a white silhouette.
  { light: "/IIC_LOGO.png", dark: "/IIC_LOGO.png", alt: "IIC Logo", darkFilter: "brightness(0) invert(1)" },
];

const NAV = [
  { to: '/', label: 'Board', icon: Trophy },
  { to: '/reveal', label: 'Reveal', icon: Sparkles },
  { to: '/lb', label: 'Classic', icon: LayoutList },
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Text fontFamily="'JetBrains Mono', monospace" fontSize="sm" fontWeight="bold" letterSpacing="wider" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {now.toLocaleTimeString('en-GB')}
    </Text>
  );
}

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { pathname } = useLocation();
  const [, setPaletteOpen] = useToggle(paletteOpen);
  const [hyper, setHyper] = useToggle(hyperMode);
  const glass = useColorModeValue('rgba(255,255,255,0.62)', 'rgba(14,6,28,0.55)');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const pillBg = useColorModeValue('rgba(255,102,0,0.14)', 'rgba(255,102,0,0.24)');
  const hoverBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  // Fades out content scrolling under the floating pill.
  const scrim = useColorModeValue(
    'linear-gradient(to bottom, rgba(255,246,238,0.92) 40%, rgba(255,246,238,0))',
    'linear-gradient(to bottom, rgba(7,2,15,0.92) 40%, rgba(7,2,15,0))'
  );

  return (
    <>
      <Box as="header" position="sticky" top={0} zIndex="sticky" px={{ base: 2, md: 4 }} pt={3} pb={3} mb={-3} bgImage={scrim}>
        <Box className="nav-shell" maxW="6xl" mx="auto" borderRadius="full" position="relative">
          <Flex
            bg={glass}
            backdropFilter="blur(18px) saturate(180%)"
            borderRadius="full"
            pl={{ base: 3, md: 5 }}
            pr={{ base: 2, md: 3 }}
            py={2}
            align="center"
            justify="space-between"
            gap={3}
          >
            <Flex as={RouterLink} to="/" align="center" gap={{ base: 2, md: 4 }} flexShrink={0} aria-label="Home">
              {logos.map((logo, index) => (
                <Image
                  key={logo.alt}
                  src={colorMode === 'light' ? logo.light : logo.dark}
                  alt={logo.alt}
                  h={{ base: '26px', md: '36px' }}
                  display={index === 0 ? 'block' : { base: 'none', lg: 'block' }}
                  filter={colorMode === 'dark' ? logo.darkFilter : undefined}
                  transition="transform 0.3s"
                  _hover={{ transform: 'scale(1.08) rotate(-2deg)' }}
                />
              ))}
            </Flex>

            <Flex as="nav" align="center" gap={1}>
              {NAV.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Box
                    key={to}
                    as={RouterLink}
                    to={to}
                    position="relative"
                    px={{ base: 2.5, md: 4 }}
                    py={1.5}
                    borderRadius="full"
                    fontWeight="bold"
                    fontSize="sm"
                    color={active ? ORANGE : textColor}
                    _hover={{ bg: active ? undefined : hoverBg }}
                    aria-current={active ? 'page' : undefined}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        style={{ position: 'absolute', inset: 0, borderRadius: 999, background: pillBg, border: '1px solid rgba(255,102,0,0.55)', boxShadow: '0 0 18px rgba(255,102,0,0.35)' }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <Flex position="relative" align="center" gap={1.5}>
                      <Icon size={15} />
                      <Text as="span" display={{ base: 'none', sm: 'inline' }}>{label}</Text>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>

            <Flex align="center" gap={2} flexShrink={0}>
              <Box display={{ base: 'none', xl: 'block' }} color={mutedColor} mr={1}>
                <Clock />
              </Box>
              <Button
                onClick={() => setPaletteOpen(true)}
                size="sm"
                variant="ghost"
                borderRadius="full"
                border="1px solid"
                borderColor="rgba(255,102,0,0.4)"
                color={mutedColor}
                leftIcon={<Search size={14} />}
                display={{ base: 'none', md: 'inline-flex' }}
                _hover={{ bg: hoverBg, color: textColor }}
              >
                Jump to…
                <Kbd ml={2} fontSize="2xs">{isMac ? '⌘' : 'Ctrl'} K</Kbd>
              </Button>
              <IconButton
                onClick={() => setPaletteOpen(true)}
                size="sm"
                variant="ghost"
                borderRadius="full"
                aria-label="Open command palette"
                icon={<Search size={16} />}
                display={{ base: 'inline-flex', md: 'none' }}
              />
              <Tooltip label={hyper ? 'Disengage HYPER MODE' : 'HYPER MODE (or try the Konami code)'} hasArrow>
                <IconButton
                  onClick={() => setHyper((v) => !v)}
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  aria-label="Toggle hyper mode"
                  aria-pressed={hyper}
                  color={hyper ? ORANGE : mutedColor}
                  icon={<Zap size={16} fill={hyper ? ORANGE : 'none'} />}
                  _hover={{ bg: hoverBg }}
                />
              </Tooltip>
              <IconButton
                onClick={toggleColorMode}
                size="sm"
                variant="ghost"
                borderRadius="full"
                aria-label="Toggle color mode"
                _hover={{ bg: hoverBg }}
                overflow="hidden"
                icon={
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={colorMode}
                      initial={{ y: -20, rotate: -90, opacity: 0 }}
                      animate={{ y: 0, rotate: 0, opacity: 1 }}
                      exit={{ y: 20, rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex' }}
                    >
                      {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                    </motion.span>
                  </AnimatePresence>
                }
              />
            </Flex>
          </Flex>
        </Box>
      </Box>
      <Ticker />
    </>
  );
};

export default Header;
