// Layout for every route: shader backdrop, command palette and the Konami easter egg.
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useToast } from '@chakra-ui/react';
import confetti from 'canvas-confetti';
import ShaderBackground from './ShaderBackground';
import CommandPalette from './CommandPalette';
import { hyperMode, useToggle } from '../lib/vibes';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export default function Shell() {
  const [hyper, setHyper] = useToggle(hyperMode);
  const toast = useToast();

  useEffect(() => {
    let progress = 0;
    const onKey = (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0;
      if (progress === KONAMI.length) {
        progress = 0;
        setHyper((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setHyper]);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-hyper', hyper);
    if (!hyper) return;
    toast({ id: 'hyper', title: 'HYPER MODE ENGAGED', description: 'Hit ⚡ again to calm down.', status: 'warning', duration: 2500, position: 'top' });
    confetti({ particleCount: 160, spread: 120, startVelocity: 50, origin: { y: 0.3 }, disableForReducedMotion: true, zIndex: 2000 });
  }, [hyper, toast]);

  return (
    <>
      <ShaderBackground />
      <div className="grain" aria-hidden="true" />
      <Box position="relative" zIndex={1}>
        <Outlet />
      </Box>
      <CommandPalette />
    </>
  );
}
